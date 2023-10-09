import { UploadRounded } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { styled } from '@mui/system';
import { parse, ParseResult } from 'papaparse';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type Result = ParseResult<Record<string, string>>;

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface CsvFileInputProps {
  helpText: string;
  importValues: (values: string[]) => void;
}

function CsvFileInput({ helpText, importValues }: CsvFileInputProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result | null>(null);
  const [column, setColumn] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setOpen(true);
    setLoading(true);
    setResults(null);
    setColumn(null);
    setError(false);
    try {
      const result: Result = await new Promise((complete, error) =>
        parse(file, { header: true, encoding: 'utf-8', complete, error })
      );
      setResults(result);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = () => {
    importValues(results?.data.map((row) => row[column ?? '']).filter(Boolean) || []);
    handleClose();
  };

  return (
    <>
      <Button component='label' variant='contained' startIcon={<UploadRounded />}>
        {t('csv-file-input.upload-button')}
        <VisuallyHiddenInput type='file' accept='.csv' onChange={handleUpload} />
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth>
        <DialogTitle>{t('csv-file-input.title')}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display='flex' justifyContent='center'>
              <CircularProgress />
            </Box>
          ) : (
            <Box mt={2} display='flex' flexDirection='column' gap={2}>
              <Typography gutterBottom>{helpText}</Typography>
              {error && <Alert severity='error'>{t('csv-file-input.upload-error')}</Alert>}
              {results?.errors.map((resultError) => (
                <Alert severity='error'>
                  {t('csv-file-input.parser-error', {
                    description: resultError.message,
                    row: resultError.row,
                  })}
                </Alert>
              ))}
              <FormControl fullWidth>
                <InputLabel>{t('csv-file-input.select-column')}</InputLabel>
                <Select
                  label={t('csv-file-input.select-column')}
                  value={column || ''}
                  onChange={(event) => setColumn(event.target.value)}
                  fullWidth
                >
                  {results?.meta.fields?.map((column) => (
                    <MenuItem key={column} value={column}>
                      {column}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button color='error' onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={results === null || column === null}>
            {t('csv-file-input.import-button')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default CsvFileInput;
