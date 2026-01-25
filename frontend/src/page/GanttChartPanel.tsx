import { plan } from '../lib/Plan';
import Paper from '@mui/material/Paper';
import {GppGanttChart,IGppGanttConfig,GppDefaultConfig,IGppGanttData,IGppGanttColumns} from "../component/GppGanttChart";
import {useState} from 'react';
import {EditTaskModal} from './TaskModal';
import {useWindowSize} from "../component/useWindowsSize";
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

// 表示スケールのPropsの型
type SelectScaleProps = {
  mode: string;
  unit: string;
  width_class: string;
  setMode: (mode:string) => void;
  setUnit: (unit:string) => void;
  setWidth: (width:string) => void;
}

// 表示スケールの変更
function SelectScale(props:SelectScaleProps) {
    return (
        <Grid container spacing={1} justifyContent="flex-end" sx={{width:1}}>
            <Select 
                id="mode"
                value={props.mode} size="small"
                onChange={(event) => {
                    props.setMode(event.target.value);
                }}>
                <MenuItem value="normal">標準</MenuItem>
                <MenuItem value="shrink">圧縮</MenuItem>
            </Select>
            <Button variant={props.width_class=="standard"? "contained":"outlined"} sx={{padding:0}} onClick={(e)=>{props.setWidth("standard")}}>標準</Button>
            <Button variant={props.width_class=="narrow"? "contained":"outlined"} sx={{padding:0}} onClick={(e)=>{props.setWidth("narrow")}}>狭い</Button>
            <Button variant={props.unit=="month"? "contained":"outlined"} sx={{padding:0}} onClick={(e)=>{props.setUnit("month")}}>月</Button>
            <Button variant={props.unit=="week"? "contained":"outlined"} sx={{padding:0}} onClick={(e)=>{props.setUnit("week")}}>週</Button>
            <Button variant={props.unit=="day"? "contained":"outlined"} sx={{padding:0}} onClick={(e)=>{props.setUnit("day")}}>日</Button>
        </Grid>);
}

function GppGanttPanel() {
    // データ
    const [data,setData] = useState(plan.getGppGanttData());
    const links = plan.getGppGanttLinks();
    // 単位・幅
    const [mode,setMode] = useState<string>("normal");
    const [unit,setUnit] = useState<string>("day");
    const [width_class,setWidthClass] = useState<string>("standard");
    // 編集モーダル用
    const [open, setOpen] = useState(false);
    const [task_id, setTaskId] = useState<number>(0);
    // 編集モーダルを閉じる
    const handleOpen = () => setOpen(true);
    // 編集モーダルを閉じる
    const handleClose = () => {
        setData(plan.getGppGanttData());
        setOpen(false);
    }


    const config:IGppGanttConfig = GppDefaultConfig();
    config.holidaies = plan.holidaies.getDays();
    if (unit == "day" || unit == "week" || unit == "month") {
        config.calendar_unit = unit;
    }
    if (width_class == "standard" || width_class == "narrow") {
        config.cell_width_class = width_class;
    }

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

    // オープンクローズ
    function changeOpenClose(id:number,open:boolean) {
        plan.tasks.changeOpen(id,open);
        setData(plan.getGppGanttData());
    }

    // ガントチャートの高さと幅
    const size = useWindowSize();
    const width = size[0];
    const height = size[1]-160;

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden', margin: "1px" }}>
            <SelectScale mode={mode} setMode={setMode} unit={unit} setUnit={setUnit} width_class={width_class} setWidth={setWidthClass}/>
            <GppGanttChart mode={mode} width={width} height={height} config={config} columns={columns} data={data} links={links} onClickTask={clickTask} changeOpenClose={changeOpenClose}/>
            <EditTaskModal 
                open={open}
                handleClose={handleClose} 
                task_id={task_id}
            />
        </Paper>
    );
}

export default GppGanttPanel;