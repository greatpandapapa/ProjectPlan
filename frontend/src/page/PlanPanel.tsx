import {useState,ChangeEvent,ReactElement,SyntheticEvent} from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { DateField } from '@mui/x-date-pickers/DateField';
import dayjs, { Dayjs } from 'dayjs';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { plan,CPlan } from '../lib/Plan';
import { ReferenceList } from "../component/ReferenceList";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {API,IgetHistoryResponse,IgetListResponse,IgetListRow,IgetHistoryRow,ILoadDataResponse} from "../lib/Api";
import {DataJson} from "../lib/typings";
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { Link,useNavigate  } from 'react-router-dom';

/**
 * 旅行計画の編集画面
 * 
 * @returns
 */
function PlanPanel() {
    const [name,  setName]  = useState<string>(plan.name);
    const [title, setTitle] = useState<string>(plan.title);
    const [purpose, setPurpose] = useState<string>(plan.purpose);
    const [status, setStatus] = useState<string>(plan.status);
    const [masterplan,setMasterPlan] = useState<null|string>(plan.masterplan);
    const [ticket_url,setTicketUrl] = useState<string>(plan.ticket_url);
    const [loaded,setLoaded] = useState<boolean>(false);
    const [masterList,setMasterList] = useState<(null|string)[]>([]);
    const [history,setHistory] = useState<IgetHistoryRow[]>([]);

    if (!loaded) {
        let master_list:(null|string)[] = [];
        let history_list:IgetHistoryRow[];
        const p1 = API.getList((response: IgetListResponse)=>{
            let row:IgetListRow;
            for (row of response.result) {
                if (row.name != plan.name) {
                    master_list.push(row.name);
                }
            }
        });
        const p2 = API.getHistory(name,(response: IgetHistoryResponse)=>{
            history_list = response.result;
        });
        Promise.all([p1,p2]).then(()=>{
            setMasterList(master_list);
            setHistory(history_list);
            setLoaded(true);
        });
        return (<>loading...</>);  
    }
    
    // ステータスの選択肢
    const status_menuItems = CPlan.getStatusValueOptions().map((option) => (
        <MenuItem value={option.value}>{option.label}</MenuItem>
    ));
    // ステータスの選択肢
    const masterplan_menuItems = masterList.map((name) => (
        (name ===  null)? <MenuItem value="">なし</MenuItem> : <MenuItem value={name}>{name}</MenuItem>
    ));

    // Revフィールドの背景色
    let rev_background:string = "";
    let rev_color = "";
    if (plan.old_version == true) {
        rev_background = "red";
        rev_color = "white";
    }
    return (
        <Box width={800}>
            <Grid container spacing={2} alignItems="center">
                <Grid size={9}>
                    <TextField label="ファイル名" fullWidth size="small" value={name}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        plan.name = event.target.value;
                        plan.modified();
                        setName(plan.name);
                      }}/>
                </Grid>
                <Grid size={3}>
                    <FormControl fullWidth>
                    <InputLabel size="small" id="status-select-label">ステータス</InputLabel>
                    <Select labelId="status-select-label" 
                      id="status"
                      value={status} sx={{width:150}} size="small"
                      onChange={(event) => {
                            plan.status = event.target.value;
                            plan.modified();
                            setStatus(plan.status);
                        }}>
                        {status_menuItems}
                    </Select>
                    </FormControl>
                </Grid>
                <Grid size={1}><Box fontSize={16}>作成日</Box></Grid>
                <Grid size={3}><Box fontSize={16} sx={{border:"solid #CCCCCC"}}>{plan.create_date}</Box></Grid>
                <Grid size={1}><Box fontSize={16}>更新日</Box></Grid>
                <Grid size={3}><Box fontSize={16} sx={{border:"solid #CCCCCC"}}>{plan.update_date}</Box></Grid>
                <Grid size={1}><Box fontSize={16}>Rev</Box></Grid>
                <Grid size={3}><Box fontSize={16} sx={{border:"solid #CCCCCC",background:rev_background,color:rev_color}}>{plan.rev}</Box></Grid>
                <Grid size={12}>
                    <TextField label="タイトル" fullWidth size="small" value={title}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        plan.title = event.target.value;
                        plan.modified();
                        setTitle(plan.title);
                      }}/>
                </Grid>
                <Grid size={12}>
                    <TextField label="説明" multiline rows={3} fullWidth size="small" value={purpose}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        plan.purpose = event.target.value;
                        plan.modified();
                        setPurpose(plan.purpose);}}/>
                </Grid>
                <Grid size={12}>
                    <FormControl fullWidth>
                    <InputLabel size="small" id="masterplan-select-label">マスタープラン</InputLabel>
                    <Select labelId="masterplan-select-label"
                      id="masterplan"
                      value={masterplan} sx={{width:150}} size="small"
                      onChange={(event) => {
                            plan.masterplan = event.target.value;
                            plan.resetMasterPlan();
                            plan.loadMasterPlan();
                            plan.modified();
                            setMasterPlan(plan.masterplan);
                        }}>
                        {masterplan_menuItems}
                    </Select>
                    </FormControl>
                </Grid>
                <Grid size={12}>
                    <TextField label="チケットURL" fullWidth size="small" value={ticket_url}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        plan.ticket_url = event.target.value;
                        plan.modified();
                        setTicketUrl(plan.ticket_url);
                      }}/>
                </Grid>
            </Grid>
            <ReferenceList edit={true}/>
            <LoadOldVersion name={name} history={history} loaded={setLoaded}/>
        </Box>
    );
}
type LoadOldVersionProps = {
    name: string;
    history: IgetHistoryRow[];
    loaded: (flg:boolean)=>void;
}
/**
 * 過去リビジョンの読み込み
 */
function LoadOldVersion(props:LoadOldVersionProps) {
    const [rev,setRev] = useState<string>("");
    if (rev == "" && props.history.length > 0) {
        setRev(props.history[0].rev);
    }

    return (
        <Grid container sx={{"justifyContent":"left","alignItem":"left"}} spacing={1}>
            <Grid>旧バージョン
            </Grid>
            <Grid>
                <Select id="rev" value={rev} size="small"
                    onChange={(event) => {
                        setRev(event.target.value);
                    }}>
                    {props.history.map((row)=>{
                        return (<MenuItem value={row.rev}>Rev {row.rev}({row.update_date})</MenuItem>)
                    })}
                </Select>
            </Grid>
            <Grid>
                <Button variant="outlined"
                onClick={(event) => {
                    API.loadData(props.name,rev,(response)=>{
                        plan.load(((response as unknown) as ILoadDataResponse).result.data as DataJson);
                        plan.loadMasterPlan();
                        plan.old_version = true;
                        props.loaded(false);
                    });   
                }}>Load</Button>
            </Grid>
        </Grid>
    );
}

export default PlanPanel;
