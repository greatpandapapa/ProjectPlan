//https://svar.dev/react/gantt/
//https://github.com/svar-widgets/react-gantt

import { Locale } from "@svar-ui/react-core";
import { 
    Gantt, Willow, Toolbar , IApi, Editor, ContextMenu , ITask,
    defaultToolbarButtons,defaultEditorItems,IGanttColumn} from "@svar-ui/react-gantt"; 
import "@svar-ui/react-gantt/all.css";
import {useState} from 'react';
import {ja,getScales,dayStyle} from "./ReactGanttPanelConfig";
import Box from '@mui/material/Box';
import {useWindowSize} from "../lib/useWindowsSize";
import Radio from '@mui/material/Radio';
import Slider from '@mui/material/Slider';
import Grid from '@mui/material/Grid';
import { plan } from '../lib/Plan';
import {IUpdateTask} from '../lib/typings';
import { format } from "date-fns";

// Propsの型
type SelectScaleProps = {
  level: string;
  setLevel: (level:string) => void;
}

function SelectScale(props:SelectScaleProps) {
    return (
        <Grid container spacing={1} alignItems="left">
            <Grid size={2}>
                スケール:
                <Radio 
                    checked={props.level === 'month'}
                    onChange={(e)=>{
                        props.setLevel("month")
                    }}
                    value="月"
                    name="radio-buttons"
                />月
                <Radio
                    checked={props.level === 'day'}
                    onChange={(e)=>{
                        props.setLevel("day")
                    }}
                    value="日"
                    name="radio-buttons"
                />日
            </Grid>

    </Grid>);
}

/**
 * 作業者パネル
 */
export function GanttPanel() {
    const size = useWindowSize();
    const [level,setLevel] = useState<string>("day");
    const [api, setApi] = useState<IApi>();
    const [tasks,setTasks] = useState<ITask[]>(plan.getReactGanttTasks());

    const links = plan.getReactGanttLinks();

    // タスクの更新をPlanオブジェクトに伝える
    function updateTask(task:ITask) {
        let uptsk:IUpdateTask 
        uptsk = {id: task.id,
                 start_date: task.start === undefined ? "2021-11-11":format(task.start,"yyyy-MM-dd"),
                 duration: task.duration,
                 name: task.text,
                 progress: task.progress,
                };
        plan.updateTaskDiff(uptsk);
        setTasks(plan.getReactGanttTasks());
    }

    // Gantの初期化
    const init = (api:IApi) => {
        api.on("update-task", (event) => {
            updateTask(event.task);
        });
        setApi(api);
    };

    const columns:IGanttColumn[] = [
        { id: "text", header: "Task name", flexgrow: 1, sort: true },
        { id: "start", header: "Start date", align: "center", sort: true },
        { id: "duration", header: "Duration", width: 90, align: "center", sort: true }
    ];

    const editorItems = defaultEditorItems.filter(item => item.key !== "details");

    const [cellWidth,scales] = getScales(level);
    //        <div style={{"overflowY":"scroll", height:size[1]-130}}>
//                    {api && <Editor api={api} items={editorItems} />}
    return (
        <div style={{overflow:"auto", height:size[1]-150}}>
            <Locale words={{ ...ja }}>
                <Willow>
                <ContextMenu api={api}>
                    <SelectScale level={level} setLevel={setLevel}/>
                    <Gantt init={init} tasks={tasks} links={links} scales={scales} readonly={true}
                           cellWidth={cellWidth} highlightTime={dayStyle} columns={columns} />
                </ContextMenu>
                </Willow>
            </Locale>
        </div>
    );
}

export default GanttPanel;
