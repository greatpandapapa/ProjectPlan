import dayjs, { Dayjs } from 'dayjs';
import {
    DataJson,
    ITaskRows,
    ITaskTable,
    IValueOptions,
    ITaskNestedTable,
    IReference,
    IHoliday,
    IUpdateTask,
} from "../lib/typings";
import jsondata from "./_template.json"
import ja from 'dayjs/locale/ja';
import {CTaskList} from "./Task"
import {CWorkerList,CWorker} from "./Worker";
import {CReferenceList} from "./Reference";
import {CHolidayList} from "./Holiday";
import {API,ILoadDataResponse} from "../lib/Api";
// react-gantt
import {ITask,ILink} from "@svar-ui/react-gantt"; 
// GppGantt
import {IGppGanttData,IGppGanttLink} from "../component/GppGanttChart";


// 日付の曜日を日本語にするため
dayjs.locale(ja);

/**
 * 旅行計画
 */
export class CPlan {
    // static
    static status_options: IValueOptions[] = [
            {value:"Plan",label:"計画中"},
            {value:"Done",label:"済み"},
            {value:"Sleep",label:"保留"},
            {value:"Rejected",label:"ボツ"},
        ];
    static type_options: IValueOptions[] = [
            {label:"",value:"normal"}, 
            {label:"MS",value:"milestone"},
            {label:"休日稼働",value:"fulltime"}, 
        ];
    static worker_type_options: IValueOptions[] = [
            {label:"管理者",value:"maanger"}, 
            {label:"リーダ",value:"leader"}, 
            {label:"開発者",value:'developer'},
            {label:"テスタ",value:'tester'},
            {label:"設備",value:'equipment'}
        ];
    static level_options: IValueOptions[] = [
            {label:"TOP",value:0},
            {label:"",value:99},
        ];
    static auto_options: IValueOptions[] = [
            {value:"",label:"なし"},
            {value:"pre",label:"前"},
            {value:"post",label:"後"}
        ];
    static progress_options: IValueOptions[] = [
            {value:0,label:"0%"},
            {value:10,label:"10%"},
            {value:20,label:"20%"},
            {value:30,label:"30%"},
            {value:40,label:"40%"},
            {value:50,label:"50%"},
            {value:60,label:"60%"},
            {value:70,label:"70%"},
            {value:80,label:"80%"},
            {value:90,label:"90%"},
            {value:100,label:"100%"}
        ];

    // プロパティ
    title: string = "";
    name: string = "";
    purpose: string = "";
    start_date: string = "";
    status: string = String(CPlan.status_options[0].value);
    masterplan: null|string = null;
    // プライベート
    private tasks: CTaskList = new CTaskList(this,jsondata);
    private workers: CWorkerList = new CWorkerList(this,jsondata);
    private references: CReferenceList = new CReferenceList(jsondata);
    private holidaies: CHolidayList = new CHolidayList(jsondata);
    // 集計情報
    public total_fee: {[index: string]: number} = {}
    // マスタープラン
    private _masterplan: null|CPlan = null;

    /**
     * コンストラクタ
     * 
     * @param data JSONデータ
     */
    constructor() {
    }

    /**
     * テンプレートを読み込む
     */
    public loadTemplateData() {
        const data = jsondata;
        this.title = data.plan.title;
        this.name = data.plan.name;
        this.purpose = data.plan.purpose;
        this.start_date = data.plan.start_date;
        this.status = data.plan.status;
        this.masterplan = data.plan.masterplan;

        this.tasks = new CTaskList(this,data);
        this.workers = new CWorkerList(this,data);
        this.references = new CReferenceList(data);
        this.holidaies = new CHolidayList(data);
    }

    /**
     * データのロード
     * 
     * @param name 保存ファイル名
     * @param data JSONデータ
     */
    public load(data: DataJson) {
        this.title = data.plan.title;
        this.name = data.plan.name;
        this.purpose = data.plan.purpose;
        this.start_date = data.plan.start_date;
        this.masterplan = data.plan.masterplan;

        this.tasks = new CTaskList(this,data);
        this.workers = new CWorkerList(this,data);
        this.references = new CReferenceList(data);
        this.holidaies = new CHolidayList(data);
    }

    /**
     * マスタープランのロード
     */
    public loadMasterPlan() {
        if (this.masterplan != null && this.masterplan != "" ) {
            if (this._masterplan === null) {
                this._masterplan = new CPlan;
                API.loadData(this.masterplan,(response:ILoadDataResponse)=>{
                    if (this._masterplan != null && response.code == 0) {
                        this._masterplan.load(response.result.data as DataJson);
                        console.log("master plan loaded");
                    }
                });
            }
        }
    }

    /**
     * TaskPanelを表示するための配列を取得する
     */
    public getTaskRows():ITaskRows[] {
        return this.tasks.getTaskRows();
    }

    /**
     * 新規スケジュールのObject
     * 
     * @param id IDの下に追加する
     */
    public addTask(id:number):number {
        return this.tasks.addTask(id);
    }
    /**
     * スケジュールの追加
     *
     * @param data 
     */
    public updateTask(data:object) {
        this.tasks.updateTask(data);
    }
    /**
     * タスクの情報を更新する（差分のみ）
     */
    public updateTaskDiff(data:IUpdateTask) {
        this.tasks.updateTaskDiff(data);
    }
    /**
     * スケジュールを削除する
     * 
     * @param id ID
     */
    public delTask(id:number) {
        this.tasks.delTask(id);
    }
    /**
     * pre_idのvaliueOptionsを取得
     */
    public getTaskPreIdValiueOptions():number[] {
        return this.tasks.getPreIdValiueOptions();
    }

    /**
     * 新規目的用のObject
     */
    public getWorkerRows():object[] {
        return this.workers.getRows();
    }
    /**
     * 新規目的地用のObject
     */
    public getNewWorker():CWorker {
        return this.workers.getNewData();
    }

    /**
     * SelectのValueOptionを出力する
     */
    public getWorkerValueOptions():Object[] {
        return this.workers.getWorkerValueOptions();
    }
    /**
     * 目的の追加
     *
     * @param data 
     */
    public updateWorker(data:object) {
        this.workers.updateData(data);
    }
    /**
     * 目的を削除する
     * 
     * @param id ID
     */
    public delWorker(id:number) {
        this.workers.delData(id);
    }
    /**}
     * 目的地を取得する
     */
    public getWorker(id:number) {
        return this.workers.getData(id);
    }

    /**
     * オプション選択肢の取得
     */
    public static getOptionLabel(key:string, mode:string):string {
        let options:IValueOptions[];
        if (mode == "type") {
            options  = (CPlan.type_options as unknown[]) as IValueOptions[];
        } else if (mode == "worker_type") {
            options  = (CPlan.worker_type_options as unknown[]) as IValueOptions[];
        } else if (mode == "start_time_auto") {
            options  = (CPlan.auto_options as unknown[]) as IValueOptions[];
        } else if (mode == "status") {
            options  = (CPlan.status_options as unknown[]) as IValueOptions[];
        } else {
            throw new Error('Internal Error');
        }
        for (let row of options) {
            if (row.value == key) {
                return row.label;
            }
        }
        return "";
    }

    /**
     * オプション選択肢の取得
     */
    public static getOptionLabelNumber(key:number, mode:string):string {
        let options:IValueOptions[];
        if (mode == "level") {
            options  = (CPlan.level_options as unknown[]) as IValueOptions[];
        } else if (mode == "progress") {
            options  = (CPlan.status_options as unknown[]) as IValueOptions[];
        } else {
            throw new Error('Internal Error');
        }
        for (let row of options) {
            if (row.value == key) {
                return row.label;
            }
        }
        return "";
    }

    /**
     * typeのValueOptions
     */
    public getTypeValueOptions():IValueOptions[] {
        return CPlan.type_options;
    }
    /**
     * typeの文字列取得
     */
    public getTypeName(key:string):string {
        return CPlan.getOptionLabel(key,"type");
    }
    /**
     * worker_typeのValueOptions
     */
    public getWorkerTypeValueOptions():IValueOptions[] {
        return CPlan.worker_type_options;
    }
    /**
     * typeの文字列取得
     */
    public getWorkerTypeName(key:string):string {
        return CPlan.getOptionLabel(key,"worker_type");
    }

    /**
     * 状態のValueOptions
     */
    public static getStatusValueOptions():IValueOptions[] {
        return  CPlan.status_options;
    }
    /**
     * 状態の文字列取得
     */
    public static getStatusName(key:string):string {
        return CPlan.getOptionLabel(key,"status");
    }

    /**
     * 状態のValueOptions
     */
    public getLevelValueOptions():IValueOptions[] {
        return  CPlan.level_options;
    }
    /**
     * 状態の文字列取得
     */
    public getLevelName(key:null|number):string {
        if (key !== null) {
            return CPlan.getOptionLabelNumber(key  ,"level");
        }
        return "";
    }

    /**
     * start_time_autoのValueOptions
     */
    public getAutoValueOptions():IValueOptions[] {
        return CPlan.auto_options;
    }
    public getAutoName(key:string):string {
        return CPlan.getOptionLabel(key,"start_time_auto");
    }

    /**
     * start_time_autoのValueOptions
     */
    public getProgressValueOptions():IValueOptions[] {
        return CPlan.progress_options;
    }
    public getProgressName(key:number):string {
        return CPlan.getOptionLabelNumber(key,"progress");
    }

    /**
     * levelのValueOptions
     */
    public getParentIdValueOptions():IValueOptions[] {
        let values:IValueOptions[] = [];
        let sc: ITask;
        let grp_ids:number[] = [];
        values.push({value:"",label:""});
        this.getTaskRows().map((row)=>{
            if (! grp_ids.includes(row.grp_id)) {
                grp_ids.push(row.grp_id);
                values.push({value:row.id,label:String(row.id)});
            }
        });
        return values;
    }

    /**
     * マスタープランのマイルストーンのValueOptions
     */
    public getMasterPlanMileStoneValueOptions():IValueOptions[] {
        let values:IValueOptions[] = [];
        values.push({value:"",label:""})
        this.getMasterMilestoneRows().map((row)=>{
            values.push({value:row.id,label:row.name});                
        });
        return values;
    }

    /**
     * マスタープランのマイルストーンのタスクを取得する
     */
    public getMasterMilestoneRows():ITaskRows[] {
        if (this._masterplan !== null) {
            return this._masterplan.getMilestoneRows();
        } else {
            return [];
        }
    }

    /**
     * マイルストーンのタスクのみ抽出する
     */
    public getMilestoneRows():ITaskRows[] {
        let rows: ITaskRows[] = [];
        this.getTaskRows().map((row:ITaskRows)=>{
            if (row.type == "milestone") {
                row.id = row.id+1000;
                rows.push(row);
            }
        });
        return rows;
    }

    /**
     * ReactGanttChart用のデータを生成する
     */
    public getReactGanttTasks():ITask[] {
        let tasks:ITask[] = [];
        let sc: ITask;
        let parent_id: number|null = null;
        if (this._masterplan !== null) {
            tasks.push({id:1000,text:"マスター",type:"summary",open:true});
            this.getMasterMilestoneRows().map((row:ITaskRows)=>{
                sc = {
                    id: row.id,
                    start: row.end_date2,
                    duration: 0,
                    text: row.name,
                    type: "milestone",
                    parent: 1000,
                };
                tasks.push(sc);
            }); 
        }
        this.getTaskRows().map((row:ITaskRows)=>{
            sc = {
                id: row.id,
                start: row.start_date2,
                duration: row.duration - 1,
                text: row.name,
                type: row.duration == 0 ? "milestone":"task",
                progress: row.progress,
            };
            if (row.level != 0) {
                sc.parent =  parent_id;
            } else {
                parent_id = row.id;
                sc.parent =  0;
                sc.open = true;
            }
            tasks.push(sc);
        });
        return tasks;
    }

    /**
     * ReactGanttChart用のリンクデータを生成する
     */
    public getReactGanttLinks():ILink[] {
        let links:ILink[] = <IGppGanttLink[]>this.getReactGanttLinks();;
        return links;
    }

    /**
     * GppGanttChart用のデータを生成する
     */
    public getGppGanttData():IGppGanttData[] {
        let data:IGppGanttData[] = [];
        let dd: IGppGanttData;
        if (this._masterplan !== null) {
            data.push({id:1000,name:"マスター",level:0});
            this.getMasterMilestoneRows().map((row:ITaskRows)=>{
                dd = {
                    id: row.id,
                    start_date: row.end_date2,
                    end_date: row.end_date2,
                    duration: 0,
                    name: row.name,
                    level: row.level,
                };
                data.push(dd);
            }); 
        }
        this.getTableRows().map((row:ITaskTable)=>{
            dd = {
                id: row.id,
                start_date: row.start_date2,
                end_date: row.end_date2,
                duration: row.duration,
                name: row.name,
                level: row.level,
                progress: row.progress,
            };
            if (row.worker_id !== null && row.worker.color != "") {
                dd.bar_color = row.worker.color;
            }            
            data.push(dd);
        });

        return data;
    }

    /**
     * GppGanttChart用のリンクデータを生成する
     */
    public getGppGanttLinks():IGppGanttLink[] {
        let links:IGppGanttLink[] = [];
        let no:number = 1;
        const rows = this.getTaskRows();
        for(let i = 0; i < rows.length; i++) {
            // 連結の前後をリンクにする
            if (i !=0 && rows[i].start_date_auto == "pre") {
                links.push({ id: no, source: rows[i-1].id, target: rows[i].id, type: "e2s" });
                no++;
            }
            if (rows[i].start_date_auto == "post") {
                links.push({ id: no, source: rows[i+1].id, target: rows[i].id, type: "s2e" });
                no++;
            }
            // マスターマイルストンをリンクにする
            let milestone:number|null;
            milestone = rows[i].master_milestone;
            if (milestone != null) {
                links.push({ id: no, source: rows[i].id, target: milestone, type: "e2s" });
                no++;
            }
        }
        return links;
    }

    /**
     * テーブル出力用のObjectを作る
     */
    public getTableRows():ITaskTable[] {
        let rows: ITaskTable[] = [];
        let sc: ITaskTable;
        this.getTaskRows().map((row)=>{
            sc = {...row,
                  worker: this.workers.getNewTableRow(),
                  level_label: this.getLevelName(row.level),
                  type_label: this.getTypeName(row.type),
                  start_time_auto_label: this.getAutoName(row.start_date_auto)};
            if (row.worker_id != null) {
                sc.worker = {...this.workers.getWorkerTableRow(row.worker_id)};
            }
            rows.push(sc);
        });
        let filter = new TableFilter(rows);

        return filter.do();
    }

    /**
     * テーブル出力用のObjectを作る
     */
    public getNestedTableRows():ITaskNestedTable[] {
        let nrows:ITaskNestedTable[] = [];
        const rows:ITaskTable[] = this.getTableRows();
        // グループの個数を数える
        let pre_grp_id:number = rows[0].grp_id;
        let grp_count:number = 0;
        let grp_head_id:number =  rows[0].id;
        let grp_rows:ITaskTable[] = [];
        for(let i = 0; i < rows.length; i++) {
            if (pre_grp_id != rows[i].grp_id) {
                nrows.push({id:pre_grp_id, count:grp_count, head_id:grp_head_id, rows:grp_rows});
                grp_rows = [];
                grp_rows.push(rows[i]);
                pre_grp_id = rows[i].grp_id;
                grp_head_id = rows[i].id;
                grp_count = 1;
            } else {
                grp_rows.push(rows[i]);
                grp_count++;
            }
        }
        nrows.push({id:pre_grp_id, count:grp_count, head_id:grp_head_id, rows:grp_rows});
        return nrows;
    }

    /**
     * スケジュールの移動
     */
    public moveTask(target_id:number,worker_id:number) {
        this.tasks.moveTask(target_id,worker_id);
    }

    /**
     * セーブデータの作成
     */
    public getSaveData():object {
        let data = {
            plan: {
                name:this.name,
                title:this.title,
                purpose: this.purpose,
                start_date: this.start_date,
                status: this.status,
                masterplan: this.masterplan,
            },
            task: this.tasks.getSaveData(),
            worker: this.workers.getSaveData(),
            reference: this.references.getSaveData(),
            holiday: this.holidaies.getSaveData(),
        }
        return data;
    }

    /**
     * 参考の配列
     */
    public getReferenceRows():IReference[] {
        return this.references.getRows();
    }
    /**
     * 新規参考のObject
     */
    public getNewReference() {
        return this.references.getNewData();
    }
    /**
     * 参考の追加
     *
     * @param data 
     */
    public updateReference(data:object) {
        this.references.updateData(data);
    }
    /**
     * 参考を削除する
     * 
     * @param id ID
     */
    public delReference(id:number) {
        this.references.delData(id);
    }
    /**}
     * 参考を取得する
     */
    public getReference(id:number) {
        return this.references.getData(id);
    }

    /**
     * 参考の配列
     */
    public getHolidayRows():IHoliday[] {
        return this.holidaies.getRows();
    }
    /**
     * 新規参考のObject
     */
    public getNewHoliday() {
        return this.holidaies.getNewData();
    }
    /**
     * 参考の追加
     *
     * @param data 
     */
    public updateHoliday(data:object) {
        this.holidaies.updateData(data);
    }
    /**
     * 参考を削除する
     * 
     * @param id ID
     */
    public delHoliday(id:number) {
        this.holidaies.delData(id);
    }
    /**}
     * 参考を取得する
     */
    public getHoliday(id:number) {
        return this.holidaies.getData(id);
    }

    /**
     * 休日の配列を取得
     */
    public getHolidayDates():string[] {
        return this.holidaies.getDays();
    }
    /**
     * 次の稼働日を取得
     */
    public getNextWorkday(today:Date,duration:number,vect:string):Date {
        return this.holidaies.getNextWorkday(today,duration,vect);
    }
}

/**
 * テーブル表示用データのフィルタ・コンバータ
 */
class TableFilter {
    rows:ITaskTable[];

    // コンストラクタ
    constructor(rows:ITaskTable[]) {
        this.rows = rows;
    }

    /**
     * フィルタ
     */
    do() {
        return this.rows;
    }
}

export let plan = new CPlan();