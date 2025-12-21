import {useState,useCallback,memo} from 'react';
import Box from '@mui/material/Box';
import { plan } from '../lib/Plan';
import {useWindowSize} from '../lib/useWindowsSize';
import { format } from "date-fns";

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import {
  GridRowsProp,
  GridRowModesModel,
  GridRowModes,
  DataGrid,
  GridColDef,
  GridToolbarContainer,
  GridActionsCellItem,
  GridEventListener,
  GridRowId,
  GridRowModel,
  GridRowEditStopReasons,
  GridSlots,
  GridRow,
  GridRowProps,
  GridRenderCellParams,
  GridRowParams,
  GridApi
} from '@mui/x-data-grid';

import {StripedDataGrid, StripedDataGridByGroup} from '../component/CustomMui';

type TaskGridProps = {
  mode: string;
}

/**
 * スケジュールGrid
 */
export function TaskGrid(props:TaskGridProps) {
  const [width, height] = useWindowSize();
  const initialRows: GridRowsProp = plan.getTaskRows(); 
  const [rows, setRows] = useState(initialRows);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  // 編集終了ボタンの処理
  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  // 編集開始ボタンの処理
  const handleEditClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  // 編集保存ボタンの処理
  const handleSaveClick = (id: GridRowId) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    const initialRows: GridRowsProp = plan.getTaskRows(); 
    setRows(initialRows);
  };

  // 削除ボタンの処理
  const handleDeleteClick = (id: GridRowId) => () => {
    plan.delTask(id as number);
    const initialRows: GridRowsProp = plan.getTaskRows(); 
    setRows(initialRows);
  };

  // 編集キャンセルボタン
  const handleCancelClick = (id: GridRowId) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows.find((row) => row.id === id);
    if (editedRow!.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  // 追加ボタン
  const handleAddClick = (id: GridRowId) => () => {
    const editedRow = rows.find((row) => row.id === id);
    if (editedRow != undefined) {
      let new_id = plan.addTask(editedRow.id);
      const initialRows: GridRowsProp = plan.getTaskRows(); 
      setRows(initialRows);
      setRowModesModel({ ...rowModesModel, [new_id]: { mode: GridRowModes.Edit } });
    }
  };

  const processRowUpdate = (newRow: GridRowModel) => {
    const updatedRow = { ...newRow, isNew: false };
    setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));

    newRow.start_date = format(newRow.start_date2, "yyyy-MM-dd");
    plan.updateTask(newRow as object)
    const initialRows: GridRowsProp = plan.getTaskRows(); 
    setRows(initialRows);

    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  // Editモードならeditableをtrueにする 
  let enable_editable:boolean;
  enable_editable = true;

  // 列の定義
  const columns: GridColDef[] = [
    {
      field: 'id', 
      headerName: 'ID', 
      width: 50, 
      editable: false,
      disableColumnMenu: true,
    },
    {
      field: 'level',
      headerName: 'Level',
      type: 'singleSelect',
      width: 80,
      align: 'center',
      editable: enable_editable,
      valueOptions: plan.getLevelValueOptions(),
    },
    {
      field: 'name',
      headerName: '作業名',
      width: 250,
      editable: enable_editable,
      type: 'string',
    },
    {
      field: 'start_date_auto',
      headerName: '連結',
      type: 'singleSelect',
      width: 60,
      align: 'left',
      headerAlign: 'left',
      editable: enable_editable,
      disableColumnMenu: true,
      valueOptions: plan.getAutoValueOptions(),
    },
    {
      field: 'start_date2',
      headerName: '開始日',
      type: 'date',
      width: 100,
      align: 'left',
      headerAlign: 'left',
      editable: enable_editable,
    },
    {
      field: 'duration',
      headerName: '日数',
      type: 'number',
      width: 80,
      align: 'left',
      headerAlign: 'left',
      disableColumnMenu: true,
      editable: enable_editable,
    },
    {
      field: 'type',
      headerName: '種類',
      width: 100,
      editable: enable_editable,
      type: 'singleSelect',
      valueOptions: plan.getTypeValueOptions(),
    },
    {
      field: 'worker_id',
      headerName: '作業者',
      width: 150,
      editable: enable_editable,
      type: 'singleSelect',
      valueOptions: plan.getWorkerValueOptions(),
    },
    {
      field: 'master_milestone',
      headerName: 'マスター',
      width: 150,
      editable: enable_editable,
      type: 'singleSelect',
      disableColumnMenu: true,
      valueOptions: plan.getMasterPlanMileStoneValueOptions(),
    },
    {
      field: 'progress',
      headerName: '進捗率',
      width: 100,
      editable: enable_editable,
      type: 'singleSelect',
      valueOptions: plan.getProgressValueOptions(),
    },
    {
      field: 'memo',
      headerName: '備考',
      width: 150,
      editable: enable_editable,
      disableColumnMenu: true,
      type: 'string'
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
            <GridActionsCellItem
              icon={<AddIcon />}
              label="Add"
              onClick={handleAddClick(id)}
              color="inherit"
            />,
          ];
        }
      },
    }
  ];

  let slots = {
//    toolbar: EditToolbar as GridSlots['toolbar'],
    row: GridRow 
  };
  let slotProps = {
    toolbar: { setRows, setRowModesModel },
  };

  return (
    <Box
      sx={{
        height: height-140,
        width: '100%',
        '& .actions': {
          color: 'text.secondary',
        },
        '& .textPrimary': {
          color: 'text.primary',
        },
        marginY: "10px" 
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
        slots={slots}
        slotProps={slotProps}
        rowHeight={35}
      />
    </Box>
  );
}

/**
 * スケジュール編集パネル
 */
export function TaskEditPanel() {
  return (
      <div>
          <TaskGrid mode="edit"></TaskGrid>
      </div>
  );
}
