import {useState,memo,ReactNode, ReactElement} from 'react';
import { plan,CPlan } from '../lib/Plan';
import {ITaskTable} from '../lib/typings';
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
import {EditTaskModal} from './TaskModal';
import EditIcon from '@mui/icons-material/Edit';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import {IconButton} from '@mui/material';
import {LEVEL} from "../component/GppGanttChart";

/**
 * タスク一覧パネル
 */
function ViewPanel() {
  const [width, height] = useWindowSize();
  const [rows,setRows] = useState(plan.getTableRows());

  // 編集モーダル用
  const [open, setOpen] = useState(false);
  const [task_id, setTaskId] = useState<number>(0);
  // 編集モーダルを閉じる
  const handleClose = () => {
    updateRows();
    setOpen(false);
  }
  // テーブル更新
  function updateRows() {
    setRows(plan.getTableRows());
  }

  /**
   * タスクテーブル
   */
  const TaskTable = () => {
    let pre_date:string = "";
    return (
      <TableContainer sx={{ maxHeight: height-140 }}>
      <Table sx={{ minWidth: 650,padding: '1px 1px' }} stickyHeader aria-label="sticky table">
        <TableHead>
          <TableRow>
            <SlimTableCell align="center" component="th">ID</SlimTableCell>
            <SlimTableCell align="center" component="th">作業名</SlimTableCell>
            <SlimTableCell align="center" component="th">開始</SlimTableCell>
            <SlimTableCell align="center" component="th">終了</SlimTableCell>
            <SlimTableCell align="center" component="th">日数</SlimTableCell>
            <SlimTableCell align="center" component="th">タイプ</SlimTableCell>
            <SlimTableCell align="center" component="th">作業者</SlimTableCell>
            <SlimTableCell align="center" component="th">進捗率</SlimTableCell>
            <SlimTableCell align="center" component="th">チケット</SlimTableCell>
            <SlimTableCell align="center" component="th">マスタMS</SlimTableCell>
            <SlimTableCell align="center" component="th">リンク</SlimTableCell>
            <SlimTableCell align="center" component="th">備考</SlimTableCell>
            <SlimTableCell align="center" component="th"></SlimTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => { 
            const ret = (<TaskTableRow key={row.id} row={row} pre_date={pre_date} updateRows={updateRows}/>);
            return (ret);
          })}
        </TableBody>
      </Table>
    </TableContainer>
    );
  };

  type TaskTableRowProps = {
    row:ITaskTable;
    pre_date:string;
    updateRows: ()=>void;
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
    let level_margin:number;
    let arrow:null|ReactNode;

    // レベル
    if (props.row.level == LEVEL.FILE) {
      level_margin = 0;
    } else if (props.row.level == LEVEL.TOP) {
      level_margin = 5;
    } else if (props.row.level == LEVEL.SUB) {
      level_margin = 10;
    } else {
      level_margin = 15;
    }
    if (props.row.level == LEVEL.FILE || props.row.level == LEVEL.TOP || props.row.level == LEVEL.SUB) {
      if (props.row.open) {
        arrow = (<ArrowDropDownIcon/>);
      } else {
//        arrow = (<ArrowDropDownIcon fontSize="small"  onClick={changeLevelOopen(true)} />);
        arrow = (<ArrowRightIcon/>);
      }
    } else {
      arrow = null;
    }
    return (
      <>
      <SlimTableCell align="center">{props.row.id}</SlimTableCell>
      <SlimTableCell align="left">
         <Box sx={{marginLeft:level_margin,padding:0}}><IconButton disableRipple={true} sx={{margin:0,padding:0}} size="small" onClick={()=>{
            plan.tasks.changeOpen(props.row.id,!props.row.open);
            props.updateRows();
          }}>{arrow}</IconButton>{props.row.name}</Box>
      </SlimTableCell>
      <SlimTableCell align="center">{props.row.start_date}</SlimTableCell>
      <SlimTableCell align="center">{props.row.end_date}</SlimTableCell>
      <SlimTableCell align="center">{props.row.duration}</SlimTableCell>
      <SlimTableCell align="center">{props.row.type_label}</SlimTableCell>
      <SlimTableCell align="center">{props.row.worker.name}</SlimTableCell>
      <SlimTableCell align="center">{props.row.progress}%</SlimTableCell>
      <SlimTableCell align="center">
        {props.row.ticket_link !== null ? (
        <Link target="_blank" href={props.row.ticket_link?.toString()}>{props.row.ticket_no}</Link>
        ):""}
      </SlimTableCell>
      <SlimTableCell align="center">{props.row.master_milestone_label}</SlimTableCell>
      <SlimTableCell align="center">{props.row.link_type}{(props.row.link_type!=""&&props.row.link_id!=null)?":":""}{props.row.link_id}</SlimTableCell>
      <SlimTableCell align="left">{props.row.memo}</SlimTableCell>
      <SlimTableCell align="center"><EditIcon onClick={()=>{
        // 編集モーダルを開く
        setTaskId(props.row.id);
        setOpen(true);
      }} /></SlimTableCell>
      </>
    );
  });

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', margin: "0px" }}>
        {TaskTable()}
      <EditTaskModal 
        open={open}
        handleClose={handleClose} 
        task_id={task_id}
      />
    </Paper>
  );
}

export default ViewPanel;