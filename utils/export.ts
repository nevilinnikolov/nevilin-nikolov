
import * as XLSX from 'xlsx';
import { CompanyLead } from '../types';

export const exportToExcel = (data: CompanyLead[]) => {
  const exportData = data.map(item => ({
    'Име на фирма': item.name,
    'ЕИК': item.eik,
    'Телефон': item.phone,
    'E-mail': item.email,
    'Адрес': item.address,
    'Уебсайт': item.website,
    'Сфера на дейност': item.industry,
    'Статус': item.status,
    'Последна актуализация': item.lastUpdated
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
  
  // Create filename with date
  const date = new Date().toISOString().split('T')[0];
  const filename = `B2B_Leads_BG_${date}.xlsx`;
  
  XLSX.writeFile(workbook, filename);
};
