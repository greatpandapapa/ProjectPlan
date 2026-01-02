import {ReactElement,useState,useCallback,memo,ChangeEvent} from 'react';
import Box from '@mui/material/Box';
import { plan } from '../lib/Plan';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import AppBar from '@mui/material/AppBar';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import {ValueOptionMenuItem} from '../component/CustomMui';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

import {
    ITask,
    ITaskRows,
} from "../lib/typings";

type EditTaskModalProps = {
  open: boolean;
  task_id: number;
  handleClose: () => void;
}

/**
 * 編集モーダル
 */
export function EditTaskModal(props:EditTaskModalProps) {
  const [reload,setReload] = useState(0);
  const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 620,
    height: 380,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 12,
    p: 2,
  };

  let task:ITaskRows;
  if (props.task_id != 0) {
    task = plan.tasks.getTaskRow(props.task_id);
  } else {
    return <></>;
  }

  // Disableにするフィールド
  let disable_fields =  {
    start_date: false,
    end_date: false,
    duration: false
  }

  if (task.start_date_auto == "normal") {
    disable_fields.end_date = true;
  } else if (task.start_date_auto == "startend") {
    disable_fields.duration = true;
  } else if (task.start_date_auto == "pre" || task.start_date_auto == "post") {
    disable_fields.start_date = true;
    disable_fields.end_date = true;
  }

  // フォームを更新
  const updateForm = (dest:ITaskRows) => {
    plan.tasks.updateTask(dest);
    setReload(reload+1);
  }

  return (
      <Modal
        open={props.open}
        onClose={props.handleClose}
      >
        <Box component="form" sx={style}>
            <AppBar position="static" color="secondary">
              タスク編集
            </AppBar>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{padding:1}}>
              <Grid size={2}>
                <TextField id="level" name="level" select label="レベル" size="small" 
                           type="number" sx={{width:100}} value={task.level} 
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  updateForm({...task,level:(event.target.value as unknown)as number});
                }}>
                {ValueOptionMenuItem(plan.getLevelValueOptions())}
                </TextField>
              </Grid>
              <Grid size={10}>
                <TextField id="name" name="name" label="作業名" size="small" sx={{width:500}} value={task.name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  updateForm({...task,name:event.target.value});
                }}>
                </TextField>
              </Grid>
              <Grid size={4}>
                <DatePicker name="start_date2" label="開始日" format="YYYY-MM-DD"
                            value={dayjs(task.start_date2)}
                           disabled={disable_fields.start_date}
                onChange={(newValue) => {
                  if (newValue !== null) {
                    updateForm({...task,start_date2:newValue.toDate()});
                  }
                }} />
              </Grid>
              <Grid size={4}>
                <DatePicker name="end_date2" label="終了日" format="YYYY-MM-DD"
                            value={dayjs(task.end_date2)}
                           disabled={disable_fields.end_date}
                onChange={(newValue) => {
                  if (newValue !== null) {
                    updateForm({...task,end_date2:newValue.toDate()});
                  }
                }} />
              </Grid>
              <Grid size={2}>
                <TextField id="duration" name="duration" label="日数" size="small" type="number" value={task.duration}
                           disabled={disable_fields.duration}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  updateForm({...task,duration:Number(event.target.value)});
                }}>
                </TextField>
              </Grid>
              <Grid size={2}>
                <TextField id="start_date_auto" name="start_date_auto" select label="連結" size="small"  sx={{width:80}} 
                           value={task.start_date_auto}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  updateForm({...task,start_date_auto:event.target.value});
                }}>
                {ValueOptionMenuItem(plan.getAutoValueOptions())}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField id="worker_id" name="worker_id" select label="作業者" size="small" sx={{width:300}} 
                 value={task.worker_id}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  updateForm({...task,worker_id:Number(event.target.value)});
                }}>
                {ValueOptionMenuItem(plan.getWorkerValueOptions())}
                </TextField>
              </Grid>
              <Grid size={3}>
                <TextField id="ticket_no" name="ticket_no" label="チケット番号" size="small" sx={{width:150}} 
                 value={task.ticket_no}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  updateForm({...task,ticket_no:event.target.value});
                }}>
                </TextField>
              </Grid>
              <Grid size={3}>
                <TextField id="progress" name="progress" select sx={{width:100}} label="進捗" size="small" type="number"
                           value={task.progress}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  updateForm({...task,progress:(event.target.value as unknown)as number});
                }}>
                {ValueOptionMenuItem(plan.getProgressValueOptions())}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField id="master_milestone" name="master_milestone" select label="マスター" size="small" sx={{width:300}} 
                 value={task.master_milestone}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  updateForm({...task,master_milestone:Number(event.target.value)});
                }}>
                {ValueOptionMenuItem(plan.getMasterPlanMileStoneValueOptions())}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField id="type" name="type" label="タイプ" size="small" select sx={{width:200}}
                           value={task.type}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  updateForm({...task,type:event.target.value});
                }}>
                {ValueOptionMenuItem(plan.getTypeValueOptions())}
                </TextField>
              </Grid>
              <Grid size={3}>
                <TextField id="link_type" name="link_type" label="リンクタイプ" size="small" select sx={{width:150}}
                           value={task.link_type}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  updateForm({...task,link_type:event.target.value});
                }}>
                {ValueOptionMenuItem(plan.getLinkTypeValueOptions())}
                </TextField>
              </Grid>
              <Grid size={4}>
                <TextField id="link_id" name="link_id" sx={{width:200}} label="リンクID" size="small" type="number"
                           value={task.link_id}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  updateForm({...task,link_id:(event.target.value as unknown)as number});
                }}>
                </TextField>
              </Grid>
              <Grid size={5}>
              </Grid>
              <Grid size={12}>
                <TextField id="memo" name="memo" label="備考" size="small" sx={{width:600}} value={task.memo}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  updateForm({...task,memo:event.target.value});
                }}>
                </TextField>
              </Grid>
            </Grid>
            </LocalizationProvider>
            <Button onClick={props.handleClose} variant="outlined">Close</Button>
        </Box>
      </Modal>
    );
}