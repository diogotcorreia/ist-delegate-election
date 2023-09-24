use hmac::{Hmac, Mac};
use sha2::Sha256;

use crate::{
    dtos::SignedPersonSearchResultDto, errors::AppError, services::fenix::PersonSearchResult,
};

type HmacSha256 = Hmac<Sha256>;

fn serialize_person_search_result(election_id: i32, username: &str, display_name: &str) -> Vec<u8> {
    [
        election_id.to_be_bytes().as_slice(),
        b"|",
        username.replace('|', "").as_bytes(),
        b"|",
        display_name.replace('|', "").as_bytes(),
    ]
    .concat()
}

pub fn sign_person_search_result(
    election_id: i32,
    search_result: PersonSearchResult,
    signing_key: &[u8],
) -> SignedPersonSearchResultDto {
    let mut mac = HmacSha256::new_from_slice(signing_key).expect("invalid key length");
    let payload =
        serialize_person_search_result(election_id, &search_result.username, &search_result.name);
    mac.update(&payload);

    let result = mac.finalize();
    SignedPersonSearchResultDto {
        username: search_result.username,
        display_name: search_result.name,
        signature: hex::encode(result.into_bytes()),
    }
}

pub fn validate_person_search_result(
    election_id: i32,
    signed_search_result: &SignedPersonSearchResultDto,
    signing_key: &[u8],
) -> Result<(), AppError> {
    let mut mac = HmacSha256::new_from_slice(signing_key).expect("invalid key length");
    let payload = serialize_person_search_result(
        election_id,
        &signed_search_result.username,
        &signed_search_result.display_name,
    );
    mac.update(&payload);

    let signature = hex::decode(&signed_search_result.signature)
        .map_err(|_| AppError::InvalidPersonSignature)?;
    mac.verify_slice(&signature)
        .map_err(|_| AppError::InvalidPersonSignature)
}

#[cfg(test)]
mod tests {
    use super::*;

    const KEY: &[u8] = b"testing key";

    #[test]
    fn validate_signature() {
        let search_result = PersonSearchResult {
            username: "ist1123456".to_string(),
            name: "John Doe".to_string(),
        };
        let signed = sign_person_search_result(1, search_result, KEY);

        assert!(validate_person_search_result(1, &signed, KEY).is_ok());
    }

    #[test]
    fn tamper_with_username() {
        let search_result = PersonSearchResult {
            username: "ist1123456".to_string(),
            name: "John Doe".to_string(),
        };
        let mut signed = sign_person_search_result(1, search_result, KEY);

        signed.username = "ist1654321".to_string();

        assert!(validate_person_search_result(1, &signed, KEY).is_err());
    }

    #[test]
    fn tamper_with_display_name() {
        let search_result = PersonSearchResult {
            username: "ist1123456".to_string(),
            name: "John Doe".to_string(),
        };
        let mut signed = sign_person_search_result(1, search_result, KEY);

        signed.display_name = "Jane Doe".to_string();

        assert!(validate_person_search_result(1, &signed, KEY).is_err());
    }

    #[test]
    fn tamper_with_election_id() {
        let search_result = PersonSearchResult {
            username: "ist1123456".to_string(),
            name: "John Doe".to_string(),
        };
        let signed = sign_person_search_result(1, search_result, KEY);

        assert!(validate_person_search_result(2, &signed, KEY).is_err());
    }

    #[test]
    fn tamper_with_signature() {
        let search_result = PersonSearchResult {
            username: "ist1123456".to_string(),
            name: "John Doe".to_string(),
        };
        let mut signed = sign_person_search_result(1, search_result, KEY);

        signed.signature = signed.signature.replace('0', "1");

        assert!(validate_person_search_result(1, &signed, KEY).is_err());
    }
}
