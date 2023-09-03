use std::{
    future::Future,
    sync::{Arc},
    time::{Duration, Instant},
};
use tokio::sync::RwLock;

struct CachedValue<T: Clone> {
    value: Option<T>,
    instant: Instant,
    duration_seconds: u64,
}

impl<T: Clone> CachedValue<T> {
    fn new(duration_seconds: u64) -> Self {
        Self {
            value: None,
            instant: Instant::now(),
            duration_seconds,
        }
    }

    fn get_value(&self) -> Option<&T> {
        self.value.as_ref()
            .filter(|_| self.instant.elapsed().as_secs() < self.duration_seconds)
    }

    fn with_value(&mut self, value: T) {
        self.value = Some(value);
        self.instant = Instant::now();
    }
}

/// Helper structure that caches a specific value for the given amount of time.
/// If the cache has expired when getting the value, the value will be fetched again.
#[derive(Clone)]
pub struct Cached<T: Clone>(Arc<RwLock<CachedValue<T>>>);

impl<T: Clone> Cached<T> {
    pub fn new(duration: Duration) -> Self {
        Self(Arc::new(RwLock::new(CachedValue::new(duration.as_secs()))))
    }

    pub async fn get<E, Fut>(&self, fetch_new_value: impl Fn() -> Fut) -> Result<T, E>
    where
        Fut: Future<Output = Result<T, E>>,
    {
        let cached_value = self.0.read().await;

        if let Some(value) = cached_value.get_value() {
            return Ok(value.clone());
        }

        // cache miss, fetch new value
        drop(cached_value); // release lock
        let mut cached_value = self.0.write().await;

        // re-check if value is valid, since another thread could have changed the cache
        if let Some(value) = cached_value.get_value() {
            return Ok(value.clone());
        }

        let new_value = fetch_new_value().await?;
        cached_value.with_value(new_value);

        Ok(cached_value.value.as_ref().unwrap().clone())
    }
}

#[cfg(test)]
mod tests {
    use std::{thread::sleep, time::Duration};

    use super::Cached;

    #[derive(Debug, PartialEq, Eq)]
    struct NoErr;

    #[tokio::test]
    async fn cache_hit() {
        let cached: Cached<u32> = Cached::new(Duration::from_secs(2));

        assert_eq!(cached.get(|| async { Ok::<u32, NoErr>(3) }).await, Ok(3));
        assert_eq!(cached.get(|| async { Ok::<u32, NoErr>(5) }).await, Ok(3));
    }

    #[tokio::test]
    async fn cache_miss() {
        let cached: Cached<u32> = Cached::new(Duration::from_secs(2));

        assert_eq!(cached.get(|| async { Ok::<u32, NoErr>(3) }).await, Ok(3));
        sleep(Duration::from_secs(2));
        assert_eq!(cached.get(|| async { Ok::<u32, NoErr>(5) }).await, Ok(5));
    }

    #[tokio::test]
    async fn cache_error() {
        let cached: Cached<u32> = Cached::new(Duration::from_secs(2));

        assert_eq!(
            cached.get(|| async { Err::<u32, NoErr>(NoErr) }).await,
            Err(NoErr)
        );
    }
}
