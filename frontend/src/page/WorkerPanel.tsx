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
import clsx from 'clsx';

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
  GridCellParams,
  GridRenderEditCellParams,
  useGridApiContext,
} from '@mui/x-data-grid';
import {StripedDataGrid} from '../component/CustomMui';
import { IValueOptions } from '../lib/typings';
import Select,{ SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

// Propsの型
type WorkerGridProps = {
  updateList: () => void;
  WorkerRows: object[];
}

type BgColorEditComponentProps = {
  params: GridRenderEditCellParams;
  bgcolors: string[];
}
/**
 * カラー選択カスタムコンポーネント
 */
function BgColorEditComponent(props: BgColorEditComponentProps) {
  let menus:ReactElement[] = [];
  props.bgcolors.map((color)=>{
    menus.push(<MenuItem sx={{background:color}} value={color}>{color}</MenuItem>);
  });
  const apiRef = useGridApiContext();

  const handleValueChange = (event: SelectChangeEvent) => {
    const newValue = event.target.value;
    apiRef.current.setEditCellValue({id:props.params.id, field:props.params.field, value: newValue});
  };

  return (
    <Select 
        id="bgcolor"
        value={props.params.value} size="small" sx={{width:150}} onChange={handleValueChange}>
        {menus}
    </Select>
  );
}

/**
 * 作業者編集のGrid
 */
function WorkerGrid(props:WorkerGridProps) {
  const [width, height] = useWindowSize();

  const rows: GridRowsProp = props.WorkerRows; 
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
    plan.workers.delData(id as number);
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
    
    plan.workers.updateData(newRow as object)
    props.updateList();

    return updatedRow;
  };

  const bgcolors:string[] = [
    "lightpink",
    "pink",
    "lavenderblush",
    "plum",
    "thistle",
    "avender",
    "ghostwhite",
    "lightsteelblue",
    "lightblue",
    "paleturquoise",
    "aquamarine",
    "lime",
    "palegreen",
    "greenyellow",
    "khaki",
    "gold",
    "moccasin",
    "peachpuff",
    "coral",
    "salmon",
    "lightgrey",
    "silver",
  ];
  // CSSのクラス生成
  let sx = {
       height: height-180,
       width: '100%',
  };
  let clr=bgcolors.reduce((acc, value, index) => {
    return { ...acc, ['& .'+value]: {backgroundColor:value} };
  }, {} );
  sx = {...sx,...clr};

  // 背景色の選択肢
  const getColorOptions = ()=>{
    let options:IValueOptions[] = [];
    bgcolors.map((color)=>{
      options.push({value:color,label:color})
    })
    return options;
  }

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
      field: 'name',
      headerName: '名前',
      type: 'string',
      width: 300,
      align: 'left',
      headerAlign: 'left',
      editable: true,
    },
    {
      field: 'type',
      headerName: '種類',
      width: 120,
      type: 'singleSelect',
      valueOptions: plan.getWorkerTypeValueOptions,
      editable: true,
    },
    {
      field: 'color',
      headerName: '色',
      width: 150,
      align: 'left',
      headerAlign: 'left',
      editable: true,
//      type: 'singleSelect',
//      valueOptions: getColorOptions(),
      renderEditCell: (params: GridRenderEditCellParams) => (
        <BgColorEditComponent params={params} bgcolors={bgcolors} />
      ),
      cellClassName: (params: GridCellParams) => {
        if (params.value == null) {
          return '';
        } else {
          return clsx(params.value);
        }
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
      sx={sx}
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
export function WorkerPanel() {
  const [WorkerRows,setWorkerRows] = useState<object[]>(plan.workers.getRows());

  // リスト更新
  const updateList = () => {
    setWorkerRows(plan.workers.getRows());
  }

  // 作業者を追加
  const addClickHandler = () => {
    const item = plan.workers.getNewData();
    plan.workers.updateData(item);
    updateList();
  }

  return (
    <div>
      <Box sx={{display: 'flex',flexDirection: 'row',m:0, p:0,marginY: "0px" }}>
        <Box sx={{m:0, p:0}}>
        <Button onClick={addClickHandler} fullWidth><AddIcon></AddIcon>追加</Button>
        </Box>
      </Box>
      <WorkerGrid WorkerRows={WorkerRows} updateList={updateList}></WorkerGrid>
    </div>
  );
}

export default WorkerPanel;