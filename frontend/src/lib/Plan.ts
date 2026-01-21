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
import { toDateString,toDateTimeString,getTodayDateString,getTodayDateTimeString } from "./Common";
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
            {value:"plan",label:"計画中"},
            {value:"done",label:"済み"},
            {value:"sleep",label:"保留"},
            {value:"rejected",label:"ボツ"},
        ];
    static type_options: IValueOptions[] = [
            {value:"normal",label:"",}, 
            {value:"milestone",label:"MS"},
            {value:"fulltime",label:"休日稼働"}, 
        ];
    static worker_type_options: IValueOptions[] = [
            {value:"maanger",label:"管理者",}, 
            {value:"leader",label:"リーダ"}, 
            {value:'developer',label:"開発者"},
            {value:'tester',label:"テスタ"},
            {value:'equipment',label:"設備",}
        ];
    static level_options: IValueOptions[] = [
            {value:0,label:"TOP",},
            {value:1,label:"SUB"},
            {value:99,label:""},
        ];
    static auto_options: IValueOptions[] = [
            {value:"normal",label:"通常"},
            {value:"startend",label:"固定"},
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
    static link_type_options: IValueOptions[] = [
            {value:"",label:""},
            {value:"s2s",label:"s2s"},
            {value:"s2e",label:"s2e"},
            {value:"e2s",label:"e2s"},
            {value:"e2e",label:"e2e"}
        ];

    // プロパティ
    title: string = "";
    name: string = "";
    rev: number = 0;
    purpose: string = "";
    create_date: string = "";
    update_date: string = "";
    status: string = String(CPlan.status_options[0].value);
    masterplan: null|string = null;
    ticket_url: string = "";
    // 旧バージョンを読み込んでいることを示すフラグ
    old_version:boolean = false;

    // プライベート
    public tasks: CTaskList = new CTaskList(this,jsondata);
    public workers: CWorkerList = new CWorkerList(this,jsondata);
    public references: CReferenceList = new CReferenceList(jsondata);
    public holidaies: CHolidayList = new CHolidayList(jsondata);
    // 集計情報
    public total_fee: {[index: string]: number} = {}
    // マスタープラン
    private _masterplan: null|CPlan = null;
    private _masterplan_options:IValueOptions[] = [];

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
        // 日付を今日の日付にする
        data.plan.create_date = getTodayDateTimeString();
        data.plan.update_date = getTodayDateTimeString();
        data.task[0].start_date = getTodayDateString();
        data.task[0].end_date = getTodayDateString();

        this.title = data.plan.title;
        this.name = data.plan.name;
        this.rev = data.plan.rev;
        this.purpose = data.plan.purpose;
        this.create_date = data.plan.create_date;
        this.update_date = data.plan.update_date;
        this.status = data.plan.status;
        this.masterplan = data.plan.masterplan;
        this.ticket_url = data.plan.ticket_url;

        this.tasks = new CTaskList(this,data);
        this.workers = new CWorkerList(this,data);
        this.references = new CReferenceList(data);
        this.holidaies = new CHolidayList(data);

        // マスタープランオブジェクトの初期化
        this.resetMasterPlan();
    }

    /**
     * CSVデータを読み込む
     */
    public loadCSVData(filename:string,csv:string[][]) {
        this.loadTemplateData();
        this.tasks.loadCSV(csv);
        this.name = filename;
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
        this.rev = data.plan.rev;
        this.purpose = data.plan.purpose;
        this.create_date = data.plan.create_date;
        this.update_date = data.plan.update_date;
        this.masterplan = data.plan.masterplan;
        this.ticket_url = data.plan.ticket_url;

        this.tasks = new CTaskList(this,data);
        this.workers = new CWorkerList(this,data);
        this.references = new CReferenceList(data);
        this.holidaies = new CHolidayList(data);
        // マスタープランオブジェクトの初期化
        this.resetMasterPlan();
    }

    // マスタープランオブジェクトの初期化
    public resetMasterPlan() {
        this._masterplan = null;
    }

    /**
     * マスタープランのロード
     */
    public loadMasterPlan() {
        if (this.masterplan != null && this.masterplan != "" ) {
            if (this._masterplan === null) {
                this._masterplan = new CPlan;
                API.loadData(this.masterplan,"",(response:ILoadDataResponse)=>{
                    if (this._masterplan != null && response.code == 0) {
                        this._masterplan.load(response.result.data as DataJson);
                        console.log("master plan loaded");
                        this._makeMasterMileStoneValueOptions();
                    }
                });
            }
        }
    }
    private _makeMasterMileStoneValueOptions() {
        this._masterplan_options = [];
        this._masterplan_options.push({value:"",label:""})
        this.getMasterMilestoneRows().map((row)=>{
            this._masterplan_options.push({value:row.id,label:row.name});                
        });
    }

    /**
     * pre_idのvaliueOptionsを取得
     */
    public getTaskPreIdValiueOptions():number[] {
        return this.tasks.getPreIdValiueOptions();
    }

    /**
     * SelectのValueOptionを出力する
     */
    public getWorkerValueOptions():IValueOptions[] {
        return this.workers.getWorkerValueOptions();
    }

    /**
     * オプション選択肢の取得
     */
    public static getOptionLabel(key:string, mode:string):string {
        let options = CPlan._getValueOptions(mode);
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
        let options = CPlan._getValueOptions(mode);
        for (let row of options) {
            if (row.value == key) {
                return row.label;
            }
        }
        return "";
    }

    /**
     * オプション選択肢のキーが適切な値か確認する
     */
    public static isValidKey(key:string, mode:string):boolean {
        let options = CPlan._getValueOptions(mode);
        for (let row of options) {
            if (row.value == key) {
                return true;
            }
        }
        return false;
    }

    /**
     * 
     */
    private static _getValueOptions(mode:string):IValueOptions[] {
        let options:IValueOptions[];
        if (mode == "type") {
            options  = (CPlan.type_options as unknown[]) as IValueOptions[];
        } else if (mode == "worker_type") {
            options  = (CPlan.worker_type_options as unknown[]) as IValueOptions[];
        } else if (mode == "start_date_auto") {
            options  = (CPlan.auto_options as unknown[]) as IValueOptions[];
        } else if (mode == "status") {
            options  = (CPlan.status_options as unknown[]) as IValueOptions[];
        } else if (mode == "level") {
            options  = (CPlan.level_options as unknown[]) as IValueOptions[];
        } else if (mode == "progress") {
            options  = (CPlan.status_options as unknown[]) as IValueOptions[];
        } else {
            throw new Error('Internal Error');
        }
        return options;
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
     * typeのキーが適正かチェックする
     */
    public isTypeValidKey(key:string):boolean {
        return CPlan.isValidKey(key,"type");
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
     * start_date_autoのValueOptions
     */
    public getAutoValueOptions():IValueOptions[] {
        return CPlan.auto_options;
    }
    public getAutoName(key:string):string {
        return CPlan.getOptionLabel(key,"start_date_auto");
    }
    /**
     * start_date_autoのキーが適正かチェックする
     */
    public isAutoValidKey(key:string):boolean {
        return CPlan.isValidKey(key,"start_date_auto");
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
        this.tasks.getTaskRows().map((row)=>{
            if (! grp_ids.includes(row.grp_id)) {
                grp_ids.push(row.grp_id);
                values.push({value:row.id,label:String(row.id)});
            }
        });
        return values;
    }

    /**
     * リンクタイプのValueOptions
     */
    public getLinkTypeValueOptions():IValueOptions[] {
        return CPlan.link_type_options;        
    }

    /**
     * マスタープランのマイルストーンのValueOptions
     */
    public getMasterPlanMileStoneValueOptions():IValueOptions[] {
        return this._masterplan_options;
    }

    /**
     * マスタープランのマイルストーン名を取得
     */
    public getMasterPlanMilestoneName(key:null|number):string{
        if (key !== null) {
            for (let row of this._masterplan_options) {
                if (row.value == key) {
                    return row.label;
                }
            }
        }
        return "";
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
        this.tasks.getTaskRows().map((row:ITaskRows)=>{
            if (row.type == "milestone") {
                let row2 = {...row};
                row2.id = row2.id+1000;
                rows.push({...row2});
            }
        });
        return rows;
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
                    start_date: row.start_date2,
                    end_date: row.end_date2,
                    duration: row.duration,
                    name: row.name,
                    level: 99,
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
        const rows = this.tasks.getTaskRows();
        for(let i = 0; i < rows.length; i++) {
            // 連結の前後をリンクにする
            if (i > 0 && rows[i].start_date_auto == "pre") {
                links.push({ id: no, source: rows[i-1].id, target: rows[i].id, type: "e2s" });
                no++;
            }
            if (i < rows.length - 1 && rows[i].start_date_auto == "post") {
                links.push({ id: no, source: rows[i+1].id, target: rows[i].id, type: "s2e" });
                no++;
            }
            // マスターマイルストンをリンクにする
            let milestone:number|null;
            milestone = rows[i].master_milestone;
            if (milestone != null) {
                links.push({ id: no, source: rows[i].id, target: milestone, type: "e2e" });
                no++;
            }
            // リンク情報に基づいてリンクする
            let link_id:null|number = rows[i].link_id;
            let link_type:string = rows[i].link_type;
            if (rows[i].link_type != "" && link_id !== null &&
                (link_type == "s2s" || link_type == "s2e" || link_type == "e2s" || link_type == "e2e")) {
                links.push({ id: no, source: rows[i].id, target: link_id, type: link_type });
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
        this.tasks.getTaskRows().map((row)=>{
            sc = {...row,
                  worker: this.workers.getNewTableRow(),
                  level_label: this.getLevelName(row.level),
                  type_label: this.getTypeName(row.type),
                  start_date_auto_label: this.getAutoName(row.start_date_auto),
                  master_milestone_label: this.getMasterPlanMilestoneName(row.master_milestone),
                  ticket_link: this.getTicketLink(row.ticket_no)
                };
            if (row.worker_id != null) {
                sc.worker = {...this.workers.getWorkerTableRow(row.worker_id)};
            }
            rows.push(sc);
        });
        let filter = new TableFilter(rows);

        return filter.do();
    }

    /**
     * CSVファイルのデータを取得する
     */
    public getCSVData():string {
        let csv:string = "id,start_date_auto,start_date,end_date,duration,type,name,master_milestone,worker,memo,level,progress,ticket_no,link_type,link_id\r\n";
        this.getTableRows().map((row)=>{
            csv += row.id+",";
            csv += row.start_date_auto+",";
            csv += row.start_date+",";
            csv += row.end_date+",";
            csv += row.duration+",";
            csv += row.type+",";
            csv += row.name+",";
            csv += ((row.master_milestone === null || row.master_milestone === undefined)?"":row.master_milestone_label)+",";
            csv += ((row.worker_id === null || row.worker_id === undefined)?"":row.worker.name)+",";
            csv += ((row.memo === null || row.memo === undefined)?"":row.memo)+",";
            csv += row.level+",";
            csv += row.progress+",";
            csv += ((row.ticket_no === null || row.ticket_no === undefined)?"":row.ticket_no)+",";
            csv += ((row.link_type === null || row.link_type === undefined)?"":row.link_type)+",";
            csv += ((row.link_id === null || row.link_id === undefined)?"":row.link_id);
            csv += "\r\n";
        });
        return csv;
    }

    /**
     * チケットのURLを出力する
     * @param ticket_no チケット番号
     * @returns 
     */
    public getTicketLink(ticket_no:string):null|URL {
        if (this.ticket_url == "" || this.ticket_url === undefined || ticket_no == "" || ticket_no === undefined) {
            return null;
        } else {
            const url:URL = new URL(this.ticket_url+ticket_no);
            return url;
        }
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
        this.update_date = toDateTimeString(new Date());
        let data = {
            plan: {
                title:this.title,
                name:this.name,
                rev:this.rev,                
                purpose: this.purpose,
                create_date: this.create_date,
                update_date: this.update_date,
                status: this.status,
                masterplan: this.masterplan,
                ticket_url: this.ticket_url,
            },
            task: this.tasks.getSaveData(),
            worker: this.workers.getSaveData(),
            reference: this.references.getSaveData(),
            holiday: this.holidaies.getSaveData(),
        }
        return data;
    }
    /**
     * Revを上げる
     */
    public incRev() {
        this.rev++;
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