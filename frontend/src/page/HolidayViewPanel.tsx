import {useState,ChangeEvent,ReactElement,SyntheticEvent} from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import { plan } from '../lib/Plan';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import {useWindowSize} from '../component/useWindowsSize';
import { Link } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { format } from "date-fns";

import {
  GridRowsProp,
  GridColDef,
  GridActionsCellItem,
  GridRowId,
  GridEventListener,
  GridRowModel,
  GridRowEditStopReasons,
  GridSlots,
  GridRow,
  GridRowModes,
  GridRowModesModel,
} from '@mui/x-data-grid';
import {StripedDataGrid} from '../component/CustomMui';

// Propsの型
type HolidayGridProps = {
  updateList: () => void;
  HolidayRows: object[];
}

export function HolidayGrid(props:HolidayGridProps) {
  const [width, height] = useWindowSize();

  const rows: GridRowsProp = props.HolidayRows; 
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  // 編集終了ボタンの処理
  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
    props.updateList();
  };

  // 編集開始ボタンの処理
  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  // 編集保存ボタンの処理
  const handleSaveClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    props.updateList();
  };

  // 削除ボタンの処理
  const handleDeleteClick = (id: GridRowId) => () => {
    plan.holidaies.delData(id as number);
    props.updateList();
  };

  // 編集キャンセルボタン
  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
  };

  /**
   * 編集データのアップデート処理
   */
  const processRowUpdate = (newRow: GridRowModel) => {
    const updatedRow = { ...newRow, isNew: false };
    
    plan.holidaies.updateData(newRow as object)
    props.updateList();

    return updatedRow;
  };

  /**
   * 行のモード変更
   */
  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const columns: GridColDef[] = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 80, 
      editable: false 
    },
    {
      field: 'date',
      headerName: '日付',
      type: 'date',
      width: 300,
      align: 'left',
      headerAlign: 'left',
      editable: true,
      valueFormatter: (value) => {
        if (value) {
          return format(value, 'yyyy-MM-dd');
        }
        return '';
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        } else {
          return [
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              onClick={handleEditClick(id)}
              color="inherit"
            />,
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              onClick={handleDeleteClick(id)}
              color="inherit"
            />,
          ];
        }
      },
    },
  ];

  return (
    <Box
      sx={{
        height: height-180,
        width: '100%',
        '& .actions': {
          color: 'text.secondary',
        },
        '& .textPrimary': {
          color: 'text.primary',
        },
      }}
    >
        <StripedDataGrid
            rows={rows}
            columns={columns}
            editMode="row"
            rowModesModel={rowModesModel}
            onRowModesModelChange={handleRowModesModelChange}
            onRowEditStop={handleRowEditStop}
            processRowUpdate={processRowUpdate}
            rowHeight={35}
        />
    </Box>
  );
}

/**
 * 作業者パネル
 */
export function HolidayPanel() {
  const [HolidayRows,setHolidayRows] = useState<object[]>(plan.holidaies.getRows());
  const [date,setDate] = useState<Dayjs>(dayjs(new Date()));

  // リスト更新
  const updateList = () => {
    setHolidayRows(plan.holidaies.getRows());
  }

  // 作業者を追加
  const addClickHandler = () => {
    const item = plan.holidaies.getNew(date.toDate());
    plan.holidaies.updateData(item);
    updateList();
  }

  return (
    <div>
      <Box sx={{display: 'flex',flexDirection: 'row',m:0, p:0,marginY: "0px" }}>
        <Box sx={{m:0, p:0}}>
        <DatePicker sx={{margin:0}} format="YYYY-MM-DD"
                    defaultValue={date} 
                    onChange={(newdate)=>{if (newdate != null) setDate(newdate);}} />
        <Button onClick={addClickHandler} variant="outlined">追加</Button>
        </Box>
      </Box>
      <HolidayGrid HolidayRows={HolidayRows} updateList={updateList}></HolidayGrid>
    </div>
  );
}

export default HolidayPanel;