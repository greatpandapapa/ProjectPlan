import { plan } from '../lib/Plan';
import Paper from '@mui/material/Paper';
import {GppGanttChart,IGppGanttConfig,GppDefaultConfig,IGppGanttData,IGppGanttColumns} from "../component/GppGanttChart";
import {useState} from 'react';
import { l } from 'react-router/dist/development/index-react-server-client-BSxMvS7Z';

function GppGanttPanel() {
    const data = plan.getGppGanttData();
    const links = plan.getGppGanttLinks();
    
    const config:IGppGanttConfig = GppDefaultConfig();
    config.holidaies = plan.getHolidayDates();

    const columns:IGppGanttColumns [] =  [
        {id:"name",name:"名前",align:"left",width:120},
        {id:"start_date",name:"開始",align:"center",width:80},
        {id:"end_date",name:"終了",align:"center",width:80},
        {id:"duration",name:"日数",align:"center",width:40,},
    ]

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden', margin: "0px" }}>
            <GppGanttChart config={config} columns={columns} data={data} links={links}/>
        </Paper>
    );
}

export default GppGanttPanel;