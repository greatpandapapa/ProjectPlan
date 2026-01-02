import {useState,memo} from 'react';
import { plan,CPlan } from '../lib/Plan';
import {ITaskTable,ITaskRows} from '../lib/typings';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {useWindowSize} from '../component/useWindowsSize';
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
export function MasterViewPanel() {
  const [width, height] = useWindowSize();
  //const rows = plan.getTableRows(); 
  const rows = plan.getMasterMilestoneRows();
  
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

  type TaskTableRowProps = {
    row:ITaskRows;
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
      <SlimTableCell style={{ width: 30 }} align="center">{props.row.no}</SlimTableCell>
      <SlimTableCell style={{ width: 120 }} align="left">{props.row.name}</SlimTableCell>
      <SlimTableCell style={{ width: 40 }} align="center">{props.row.start_date}</SlimTableCell>
      <SlimTableCell style={{ width: 40 }} align="center">{props.row.end_date}</SlimTableCell>
      <SlimTableCell style={{ width: 240 }} align="left">{props.row.memo}</SlimTableCell>
      </>
    );
  });

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', margin: "0px" }}>
        {TaskTable()}
    </Paper>
  );
}

export default MasterViewPanel;