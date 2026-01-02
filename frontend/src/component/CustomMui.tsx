import { ReactElement } from 'react';
import { styled } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import { DataGrid, gridClasses,DataGridProps } from '@mui/x-data-grid';
import TableCell from '@mui/material/TableCell';
import {IValueOptions} from '../lib/typings';

/**
 * 背景色
 */
export function getBgColor(mode:string) {
  if (mode === "done") {
    return '#cccccc';
  } else if (mode === "odd") {
    return '#f8f8ff';
  } else {
    return '#fffaff';
  }
}

/**
 * ストライプGrid
 */
const StripedGrid = styled(DataGrid)(({ theme }) => ({
  [`& .${gridClasses.row}.done`]: {
    backgroundColor: getBgColor('done'),
  },
  [`& .${gridClasses.row}.odd`]: {
    backgroundColor: getBgColor('odd'),
  },
  [`& .${gridClasses.row}.even`]: {
    backgroundColor: getBgColor('even'),
  }
}));
  
/**
 * ストライプDataGrid
 */
export function StripedDataGrid(props:DataGridProps) {  
  return (
    <StripedGrid 
      {...props}
      getRowClassName={(params) => {
        if (params.row.progress == 100) {
          return "done";
        } else {
          return params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
      }}
    />
  );
}

export function StripedDataGridByGroup(props:DataGridProps) {  
  return (
    <StripedGrid 
      {...props}
      getRowClassName={(params) =>
        params.row.grp_id % 2 === 0 ? 'even' : 'odd'
      }
    />
  );
}

/**
 * テーブルセルのパッディング極小板
 */
export const SlimTableCell = styled(TableCell)({
  padding: 0,
  margin: 4,
  paddingLeft: 8,
  paddingRight: 8,
})

/**
 * MenuItemを生成する
 */
export function ValueOptionMenuItem(options: IValueOptions[]) {
  let menus:ReactElement[]=[];
  options.map((opt)=>{
    menus.push(<MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>);
  });
  return menus;
}