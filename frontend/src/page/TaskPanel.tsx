import {useState,useCallback,memo,Profiler} from 'react';
import Box from '@mui/material/Box';
import { plan } from '../lib/Plan';
import {useWindowSize} from '../component/useWindowsSize';
import {EditTaskModal} from './TaskModal';
import {ITaskRows} from '../lib/typings';

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
import { format } from "date-fns";

import {StripedDataGrid, StripedDataGridByGroup} from '../component/CustomMui';

type TaskGridProps = {
  mode: string;
}

/**
 * スケジュールGrid
 */
export function TaskGrid(props:TaskGridProps) {
  const [width, height] = useWindowSize();
  const initialRows: GridRowsProp = plan.tasks.getTaskRows(); 
  const [rows, setRows] = useState(initialRows);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  // 編集モーダル用
  const [open, setOpen] = useState(false);
  const [task_id, setTaskId] = useState<number>(0);

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
    const initialRows: GridRowsProp = plan.tasks.getTaskRows(); 
    setRows(initialRows);
  };

  // 削除ボタンの処理
  const handleDeleteClick = (id: GridRowId) => () => {
    plan.tasks.delTask(id as number);
    const initialRows: GridRowsProp = plan.tasks.getTaskRows(); 
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
      let new_id = plan.tasks.addTask(editedRow.id);
      const initialRows: GridRowsProp = plan.tasks.getTaskRows(); 
      setRows(initialRows);
      setRowModesModel({ ...rowModesModel, [new_id]: { mode: GridRowModes.Edit } });
    }
  };

  // データ更新
  const processRowUpdate = (newRow: GridRowModel) => {
    plan.tasks.updateTask(newRow as ITaskRows)
    const initialRows: GridRowsProp = plan.tasks.getTaskRows(); 
    setRows(initialRows);

    let i=0;
    for(i=0;i<initialRows.length;i++) {
      if (initialRows[i].id === newRow.id) {
        break;
      }
    }
    // DataGridの編集対象業の更新
    return { ...initialRows[i], isNew: false };
  };

  const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  // 編集モーダルを閉じる
  const handleOpen = () => setOpen(true);
  // 編集モーダルを閉じる
  const handleClose = () => {
    const initialRows: GridRowsProp = plan.tasks.getTaskRows(); 
    setRows(initialRows);
    setOpen(false);
  }

  // Editモードならeditableをtrueにする 
  let enable_editable:boolean;
  enable_editable = true;

  // ウィンドウ幅から各カラムの幅を算出
  const width_1440 = {
    id: 50, 
    level: 80,
    name: 250,
    start_date_auto: 60,
    start_date2: 100, 
    end_date2: 100, 
    duration:80, 
    type: 100, 
    worker_id: 150, 
    progress: 100, 
    ticket_no: 80, 
    memo: 150, 
    actions: 100
  };
  //
  function getWidth(col_width:number) {
    return Math.floor(col_width/(1440/width));
  }

  // 列の定義
  const columns: GridColDef[] = [
    {
      field: 'id', 
      headerName: 'ID', 
      width: getWidth(width_1440.id), 
      editable: false,
      disableColumnMenu: true,
    },
    {
      field: 'level',
      headerName: 'Level',
      type: 'singleSelect',
      width: getWidth(width_1440.level), 
      align: 'center',
      headerAlign: 'center',
      editable: enable_editable,
      valueOptions: plan.getLevelValueOptions(),
    },
    {
      field: 'name',
      headerName: '作業名',
      width: getWidth(width_1440.name), 
      editable: enable_editable,
      type: 'string',
      headerAlign: 'center',
    },
    {
      field: 'start_date_auto',
      headerName: '連結',
      type: 'singleSelect',
      width: getWidth(width_1440.start_date_auto), 
      align: 'center',
      headerAlign: 'center',
      editable: enable_editable,
      disableColumnMenu: true,
      valueOptions: plan.getAutoValueOptions(),
    },
    {
      field: 'start_date2',
      headerName: '開始日',
      type: 'date',
      width: getWidth(width_1440.start_date2), 
      align: 'center',
      headerAlign: 'center',
      editable: enable_editable,
      valueFormatter: (value) => {
        if (value) {
          return format(value, 'yyyy-MM-dd');
        }
        return '';
      },
    },
    {
      field: 'end_date2',
      headerName: '終了日',
      type: 'date',
      width: getWidth(width_1440.end_date2), 
      align: 'center',
      headerAlign: 'center',
      editable: enable_editable,
      valueFormatter: (value) => {
        if (value) {
          return format(value, 'yyyy-MM-dd');
        }
        return '';
      },
    },
    {
      field: 'duration',
      headerName: '日数',
      type: 'number',
      width: getWidth(width_1440.duration), 
      align: 'right',
      headerAlign: 'center',
      disableColumnMenu: true,
      editable: enable_editable,
    },
    {
      field: 'type',
      headerName: 'タイプ',
      width: getWidth(width_1440.type), 
      align: 'center',
      headerAlign: 'center',
      editable: enable_editable,
      type: 'singleSelect',
      valueOptions: plan.getTypeValueOptions(),
    },
    {
      field: 'worker_id',
      headerName: '作業者',
      width: getWidth(width_1440.worker_id), 
      headerAlign: 'center',
      editable: enable_editable,
      type: 'singleSelect',
      valueOptions: plan.getWorkerValueOptions(),
    },
    {
      field: 'progress',
      headerName: '進捗率',
      width: getWidth(width_1440.progress), 
      align: 'right',
      headerAlign: 'center',
      editable: enable_editable,
      type: 'singleSelect',
      valueOptions: plan.getProgressValueOptions(),
    },
    {
      field: 'ticket_no',
      headerName: 'チケット',
      type: 'string',
      width: getWidth(width_1440.ticket_no), 
      align: 'center',
      headerAlign: 'center',
      disableColumnMenu: true,
      editable: enable_editable,
    },
    {
      field: 'memo',
      headerName: '備考',
      width: getWidth(width_1440.memo), 
      editable: enable_editable,
      type: 'string',
      disableColumnMenu: true,
    },
/*
    {
      field: 'master_milestone',
      headerName: 'マスター',
      width: 150,
      editable: enable_editable,
      type: 'singleSelect',
      disableColumnMenu: true,
      valueOptions: plan.getMasterPlanMileStoneValueOptions(),
    },
  */
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: getWidth(width_1440.actions), 
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
              onClick={()=>{
                setTaskId(id as number);
                handleOpen();
              }}
//              onClick={handleEditClick(id)}
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
        marginY: "0px" 
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
      <EditTaskModal 
        open={open}
        handleClose={handleClose} 
        task_id={task_id}
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