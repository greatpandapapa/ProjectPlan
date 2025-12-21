import {useState,memo} from 'react';
import { plan,CPlan } from '../lib/Plan';
import {ITaskTable} from '../lib/typings';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {useWindowSize} from '../lib/useWindowsSize';
import { Typography } from '@mui/material';
import {getBgColor} from '../component/CustomMui';
import { SlimTableCell } from '../component/CustomMui';
import { ReferenceList } from "../component/ReferenceList";
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Link } from '@mui/material';

type ViewPanelProps = {
  mode: string;
}

/**
 * スケジュール編集パネル
 */
function ViewPanel() {
  const [width, height] = useWindowSize();
  const rows = plan.getTableRows(); 

  /**
   * スケジュールテーブル
   */
  const TaskTable = () => {
    let pre_date:string = "";
    return (
      <TableContainer sx={{ maxHeight: height-140 }}>
      <Table sx={{ minWidth: 650,padding: '1px 1px' }} stickyHeader aria-label="sticky table">
        <TableHead>
          <TableRow>
            <SlimTableCell align="center" component="th">No</SlimTableCell>
            <SlimTableCell align="center" component="th">作業名</SlimTableCell>
            <SlimTableCell align="center" component="th">開始</SlimTableCell>
            <SlimTableCell align="center" component="th">終了</SlimTableCell>
            <SlimTableCell align="center" component="th">日数</SlimTableCell>
            <SlimTableCell align="center" component="th">タイプ</SlimTableCell>
            <SlimTableCell align="center" component="th">作業者</SlimTableCell>
            <SlimTableCell align="center" component="th">進捗率</SlimTableCell>
            <SlimTableCell align="center" component="th">備考</SlimTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => { 
            const ret = (<TaskTableRow key={row.id} row={row} pre_date={pre_date}/>);
            return (ret);
          })}
        </TableBody>
      </Table>
    </TableContainer>
    );
  };

  type AddressMapLinkProps = {
    address: string;
  };

  type TaskTableRowProps = {
    row:ITaskTable;
    pre_date:string;
  };

  /**
   * スケジュールテーブルの行
   * 
   * @param props 
   * @returns 
   */
  const TaskTableRow = ((props:TaskTableRowProps) => {
    let bgcolor:string;
    if (props.row.progress == 100) {
      bgcolor = getBgColor('done');
    } else {
      bgcolor = props.row.no % 2 === 0 ? getBgColor('even') : getBgColor('odd');
    }
    return (
      <TableRow key={props.row.id} style={{backgroundColor:bgcolor}}>
        <TaskSlimTableCells {...props} />
      </TableRow>
    );
  });

  const TaskSlimTableCells = ((props:TaskTableRowProps) => {
    return (
      <>
      <SlimTableCell align="center">{props.row.no}</SlimTableCell>
      <SlimTableCell align="left">
         <Box sx={{marginLeft:props.row.level==0?0:10,padding:0}}>{props.row.name}</Box>
      </SlimTableCell>
      <SlimTableCell align="center">{props.row.start_date}</SlimTableCell>
      <SlimTableCell align="center">{props.row.end_date}</SlimTableCell>
      <SlimTableCell align="center">{props.row.duration}</SlimTableCell>
      <SlimTableCell align="center">{props.row.type_label}</SlimTableCell>
      <SlimTableCell align="left">{props.row.worker.name}</SlimTableCell>
      <SlimTableCell align="center">{props.row.progress}</SlimTableCell>
      <SlimTableCell align="left">{props.row.memo}</SlimTableCell>
      </>
    );
  });

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', margin: "0px" }}>
        {TaskTable()}
    </Paper>
  );
}

export default ViewPanel;