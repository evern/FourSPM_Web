import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { DepartmentEnum } from '../../types/enums';
import { API_CONFIG } from '../../config/api';
import ODataStore from 'devextreme/data/odata/store';

// Create a store for deliverable gates
export const createDeliverableGatesStore = () => {
  return new ODataStore({
    url: `${API_CONFIG.baseUrl}/odata/v1/DeliverableGates`,
    version: 4,
    key: 'guid',
    keyType: 'Guid',
    beforeSend: (options: any) => {
      const token = localStorage.getItem('user') ? 
        JSON.parse(localStorage.getItem('user') || '{}').token : null;
      
      if (!token) {
        console.error('No token available for DeliverableGates API');
        return false;
      }

      options.headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      return true;
    }
  });
};

// Generic progress tracking columns configuration
export const createProgressColumns = (): ODataGridColumn[] => {
  const deliverableGatesStore = createDeliverableGatesStore();
  
  return [
    {
      dataField: 'bookingCode',
      caption: 'Booking Code',
      allowEditing: false,
    },
    {
      dataField: 'areaNumber',
      caption: 'Area Code',
      allowEditing: false,
    },
    {
      dataField: 'discipline',
      caption: 'Discipline',
      allowEditing: false,
    },
    {
      dataField: 'documentType',
      caption: 'Document Type',
      allowEditing: false,
    },
    {
      dataField: 'departmentId',
      caption: 'Department',
      allowEditing: false,
      lookup: {
        dataSource: Object.entries(DepartmentEnum)
          .filter(([key]) => !isNaN(Number(key)))
          .map(([value, text]) => ({ value: Number(value), text })),
        valueExpr: 'value',
        displayExpr: 'text'
      }
    },
    {
      dataField: 'internalDocumentNumber',
      caption: 'Internal Number',
      allowEditing: false,
    },
    {
      dataField: 'clientDocumentNumber',
      caption: 'Client Number',
      allowEditing: false,
    },
    {
      dataField: 'documentTitle',
      caption: 'Document Title',
      allowEditing: false,
    },
    {
      dataField: 'deliverableGateGuid',
      caption: 'Gate',
      hidingPriority: 5,
      lookup: {
        dataSource: deliverableGatesStore,
        valueExpr: 'guid',
        displayExpr: (item: any) => item ? `${item.name}` : ''
      },
    },
    {
      dataField: 'totalPercentageEarnt',
      caption: 'Total % Earnt',
      dataType: 'number',
      customizeText: (cellInfo: any) => {
        if (cellInfo.value === null || cellInfo.value === undefined) return '0.00%';
        return (cellInfo.value * 100).toFixed(2) + '%';
      },
      allowEditing: true,
      editorOptions: {
        min: 0,
        max: 1.0, // Backend stores as decimal (0-1)
        step: 0.05, // 5% increments
        format: {
          type: 'percent',
          precision: 2
        }
      },
    },
    {
      dataField: 'totalEarntHours',
      caption: 'Total Earnt Hours',
      dataType: 'number',
      allowEditing: false,
      customizeText: (cellInfo: any) => {
        if (cellInfo.value === null || cellInfo.value === undefined) return '0.00';
        return cellInfo.value.toFixed(2);
      }
    },
    {
      dataField: 'periodPercentageEarnt',
      caption: 'Period % Earnt',
      dataType: 'number',
      customizeText: (cellInfo: any) => {
        if (cellInfo.value === null || cellInfo.value === undefined) return '0.00%';
        return (cellInfo.value * 100).toFixed(2) + '%';
      },
      allowEditing: false,
    },
    {
      dataField: 'periodEarntHours',
      caption: 'Period Earnt Hours',
      dataType: 'number',
      allowEditing: false,
      customizeText: (cellInfo: any) => {
        if (cellInfo.value === null || cellInfo.value === undefined) return '0.00';
        return cellInfo.value.toFixed(2);
      }
    },
    {
      dataField: 'totalHours',
      caption: 'Total Hours',
      dataType: 'number',
      allowEditing: false,
      customizeText: (cellInfo: any) => {
        if (cellInfo.value === null || cellInfo.value === undefined) return '0.00';
        return cellInfo.value.toFixed(2);
      }
    }
  ];
};
