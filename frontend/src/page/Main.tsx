import React from 'react';
import '../App.css';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import PlanPanel from './PlanPanel';
import {TaskEditPanel} from './TaskPanel';
import SortPanel from './SortPanel';
import SavePanel from './SavePanel';
import WorkerPanel from './WorkerPanel';
import {API,ILoadDataResponse} from "../lib/Api";
import {plan} from "../lib/Plan";
import {DataJson} from "../lib/typings";
import {useLocation} from "react-router-dom";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CardTravelIcon from '@mui/icons-material/CardTravel';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import TourIcon from '@mui/icons-material/Tour';
import SaveIcon from '@mui/icons-material/Save';
import GradingIcon from '@mui/icons-material/Grading';
import FlagIcon from '@mui/icons-material/Flag';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import ChecklistRtlIcon from '@mui/icons-material/ChecklistRtl';
import MyAppBar from "../component/MyAppBar";
import ViewPanel from './ViewPanel';
import MasterViewPanel from './MasterViewPanel';
import HolidayViewPanel from './HolidayViewPanel';
import GppGanttPanel from './GppGanttPanel';
import {config,convMobileText} from "../lib/Config"

function Main() {
  const [value, setValue] = React.useState('plan');
  const [loaded,setLoaded] = React.useState<boolean>(false);
  const { state } = useLocation();

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  if (!loaded) {
    let from:string = state["from"];
    if (from == "new") {
      plan.loadTemplateData();
      setLoaded(true);
    } else if (from == "file") {
      const data = state["data"];
      plan.load((data as DataJson));
      setLoaded(true);
    } else if (from == "server") {
      let name:string = state["name"];
      API.loadData(name,(response)=>{
        plan.load(((response as unknown) as ILoadDataResponse).result.data as DataJson);
        plan.loadMasterPlan();
        setLoaded(true);
      });   
    }

    return (<>loading...</>);  
  }

  const tag_style = {borderRadius: '6px',minWidth:"32px",minHeight: config.icon_hight, height: config.icon_hight }

  const panel_padding:string = '5px';
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', margin: "0px" }}>
        <MyAppBar></MyAppBar>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={handleChange} aria-label="Main Tabs">
              <Tab icon={<CardTravelIcon />} iconPosition="start" label={convMobileText("計画")} value="plan" sx={{...tag_style, bgcolor: '#e0ffff'}} />
              <Tab icon={<CalendarMonthIcon />} iconPosition="start" label={convMobileText("タスク編集")} value="taskedit"  sx={{...tag_style, bgcolor: '#f0f8ff'}}/>
              <Tab icon={<ChecklistRtlIcon />} iconPosition="start" label={convMobileText("タスク一覧")} value="taskview"  sx={{...tag_style, bgcolor: '#99FFFF'}}/>
              <Tab icon={<GradingIcon />} iconPosition="start" label={convMobileText("ガントチャート")} value="ganttchart"  sx={{...tag_style, bgcolor: '#fce1fc'}}/>
              <Tab icon={<FlagIcon />} iconPosition="start" label={convMobileText("マスタ計画")} value="master"  sx={{...tag_style, bgcolor: '#CCFFCC'}}/>
              <Tab icon={<SwapVertIcon />} iconPosition="start" label={convMobileText("順序変更")} value="tasksort"  sx={{...tag_style, bgcolor: '#e6e6fa'}}/>
              <Tab icon={<TourIcon />} iconPosition="start" label={convMobileText("作業者")} value="worker"  sx={{...tag_style, bgcolor: '#FFDEAD'}}/>
              <Tab icon={<TourIcon />} iconPosition="start" label={convMobileText("休日設定")} value="holiday"  sx={{...tag_style, bgcolor: '#ffffe0'}}/>
              <Tab icon={<SaveIcon />} iconPosition="start" label={convMobileText("保存")} value="save"  sx={{...tag_style, bgcolor: '#f8fbf8'}}/>
            </TabList>
          </Box>
          <TabPanel value="plan" sx={{bgcolor: '#e0ffff',padding: panel_padding,paddingTop:'20px'}}>
            <Box sx={{bgcolor: '#ffffff',margin: "0px"}}>
              <PlanPanel></PlanPanel>
            </Box>
          </TabPanel>
          <TabPanel value="taskedit" sx={{bgcolor: '#f0f8ff',padding: panel_padding}}>
            <Box sx={{bgcolor: '#ffffff'}}>
              <TaskEditPanel></TaskEditPanel>
            </Box>
          </TabPanel>
          <TabPanel value="taskview" sx={{bgcolor: '#99FFFF',padding: panel_padding}}>
            <Box sx={{bgcolor: '#ffffff'}}>
              <ViewPanel></ViewPanel>
            </Box>
          </TabPanel>
          <TabPanel value="ganttchart" sx={{bgcolor: '#fce1fc',padding: panel_padding}}>
            <Box sx={{bgcolor: '#ffffff'}}>
              <GppGanttPanel></GppGanttPanel>
            </Box>
          </TabPanel>
          <TabPanel value="master" sx={{bgcolor: '#CCFFCC',padding: panel_padding}}>
            <Box sx={{bgcolor: '#ffffff'}}>
              <MasterViewPanel></MasterViewPanel>
            </Box>
          </TabPanel>
          <TabPanel value="tasksort" sx={{bgcolor: '#e6e6fa',padding: panel_padding}}>
            <Box sx={{bgcolor: '#ffffff'}}>
              <SortPanel></SortPanel>
            </Box>
          </TabPanel>
          <TabPanel value="worker"  sx={{bgcolor: '#FFDEAD',padding: panel_padding}}>
            <Box sx={{bgcolor: '#ffffff'}}>
              <WorkerPanel></WorkerPanel>
            </Box>
          </TabPanel>
          <TabPanel value="holiday" sx={{bgcolor: '#ffffe0',padding: panel_padding}}>
            <Box sx={{bgcolor: '#ffffff'}}>
              <HolidayViewPanel></HolidayViewPanel>
            </Box>
          </TabPanel>
          <TabPanel value="save" sx={{bgcolor: '#f8fbf8',padding: panel_padding}}>
            <Box>
              <SavePanel></SavePanel>
            </Box>
          </TabPanel>
        </TabContext>
    </Box>
  );
}

export default Main;
