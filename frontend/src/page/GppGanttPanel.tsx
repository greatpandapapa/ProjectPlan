import { plan } from '../lib/Plan';
import Paper from '@mui/material/Paper';
import {GppGanttChart,IGppGanttConfig,GppDefaultConfig,IGppGanttData,IGppGanttColumns} from "../component/GppGanttChart";
import {useState} from 'react';
import {EditTaskModal} from './TaskModal';

function GppGanttPanel() {
    // 編集モーダル用
    const [open, setOpen] = useState(false);
    const [task_id, setTaskId] = useState<number>(0);
    // 編集モーダルを閉じる
    const handleOpen = () => setOpen(true);
    // 編集モーダルを閉じる
    const handleClose = () => {
        setOpen(false);
    }

    const data = plan.getGppGanttData();
    const links = plan.getGppGanttLinks();

    const config:IGppGanttConfig = GppDefaultConfig();
    config.holidaies = plan.holidaies.getDays();
    config.lang_mesg_month = "月";
    config.lang_mesg_week = "週";
    config.lang_mesg_day = "日";
    config.lang_mesg_standard = "標準";
    config.lang_mesg_narrow = "狭い";
    
    const columns:IGppGanttColumns [] =  [
        {id:"id",name:"ID",align:"center",width:50},
        {id:"name",name:"名前",align:"left",width:120},
        {id:"start_date",name:"開始",align:"center",width:80},
        {id:"end_date",name:"終了",align:"center",width:80},
        {id:"duration",name:"日数",align:"center",width:40,},
    ]

    // タスク編集ダイアログを開く
    function clickTask(ids:string) {
        let id = Number(ids);
        if (id < 1000){
            setTaskId(id);
            handleOpen();
        }
    }

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden', margin: "1px" }}>
            <GppGanttChart config={config} columns={columns} data={data} links={links} onClickTask={clickTask}/>
            <EditTaskModal 
                open={open}
                handleClose={handleClose} 
                task_id={task_id}
            />
        </Paper>
    );
}

export default GppGanttPanel;