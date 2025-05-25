import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Select, FormLabel, FormControl } from '@chakra-ui/react';

/**
 * Language switcher component that allows users to change the application language
 */
const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  
  // Handle language change
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    i18n.changeLanguage(newLanguage);
  };

  return (
    <Box p={2}>
      <FormControl>
        <FormLabel htmlFor="language-select">{t('settings.language')}</FormLabel>
        <Select
          id="language-select"
          value={i18n.language}
          onChange={handleLanguageChange}
          size="sm"
        >
          <option value="en">English</option>
          <option value="zh">中文</option>
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSwitcher; 