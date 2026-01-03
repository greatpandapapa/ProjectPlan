/**
 * GppGanttChart Componennt
 * 
 * ガントチャートを表示するコンポーネント
 * 
 * @license NIT license
 * @author GreatPandaPapa
 * @homepage https://github.com/greatpandapapa
 */
import {useState,memo,ReactNode,useRef,createContext,useContext} from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { styled } from '@mui/material/styles';
import { format } from "date-fns";

/**
 * 月末のDateオブジェクトを取得
 */
function getEndOfYearDate(date:Date):Date {
    return new Date(date.getFullYear()+1, 0, 0);
}

/**
 * 月末のDateオブジェクトを取得
 */
function getEndOfMonthDate(date:Date):Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}


// ラベルの表示位置
const label_align_list = {
    center: "center",
    left: "left",
    right: "right"
} as const;
// ガントチャートの列設定
const cal_unit_list = {
    day: "day",
    week: "week",
    month: "month"
} as const;
// ガントチャートの幅
const cell_width_list = {
    standard: "standard",
    narrow: "narrow",
} as const;
// ガントチャートのconfig
export interface IGppGanttConfig {
    start: null|Date;
    end: null|Date;
    cell_height: number;
    cell_width_class: typeof cell_width_list[keyof typeof cell_width_list];
    cell_day_width: number;
    cell_week_width: number;
    cell_month_width: number;
    cell_day_width_standard: number;
    cell_week_width_standard: number;
    cell_month_width_standard: number;
    cell_day_width_narrow: number;
    cell_week_width_narrow: number;
    cell_month_width_narrow: number;
    grid_boarder_color: string;
    default_bar_fill_color: string;
    default_bar_stroke_color: string;
    default_diamond_fill_color: string;
    default_diamond_stroke_color: string;
    default_level_bar_fill_color: string;
    default_level_bar_stroke_color: string;
    progress_fill_color:string;
    calendar_satday_bgcolor: string;
    calendar_sunday_bgcolor: string;
    calendar_holiday_bgcolor: string;
    calendar_today_bgcolor: string;
    calendar_even_bgcolor: string;
    calendar_unit: typeof cal_unit_list[keyof typeof cal_unit_list];
    link_line_color: string;
    label_align: typeof label_align_list[keyof typeof label_align_list];
    holidaies: string[];
    level_indent: number;
    date_format: string;
    date_year_format: string;
    date_year_month_format: string;
    date_month_format: string;
    date_day_format: string;
    lang_mesg_month: string;
    lang_mesg_week: string;
    lang_mesg_day: string;
    lang_mesg_standard: string;
    lang_mesg_narrow: string;
}

// デフォルトのデフォルト値
export function GppDefaultConfig():IGppGanttConfig {
    return {
        start: null,
        end: null,
        cell_height:25,
        cell_width_class: "standard",
        cell_day_width: 25,
        cell_week_width: 50,
        cell_month_width: 100,
        cell_day_width_standard: 25,
        cell_week_width_standard: 50,
        cell_month_width_standard: 100,
        cell_day_width_narrow: 15,
        cell_week_width_narrow: 30,
        cell_month_width_narrow: 60,
        grid_boarder_color: "gainsboro",
        default_bar_fill_color: "lightskyblue",
        default_bar_stroke_color: "blue",
        default_diamond_fill_color: "purple",
        default_diamond_stroke_color: "blue",
        default_level_bar_fill_color: "yellow",
        default_level_bar_stroke_color: "blue",
        progress_fill_color: "gray",
        calendar_satday_bgcolor: "#DDFFFF",
        calendar_sunday_bgcolor: "#DDFFFF",
        calendar_holiday_bgcolor: "#DDFFFF",
        calendar_today_bgcolor: "#DDA0DD",
        calendar_even_bgcolor: "#F5F5F5",
        calendar_unit: "day",
        link_line_color: "red",
        label_align: "right",
        holidaies: [],
        level_indent: 4,
        date_format: "yyyy-MM-dd",
        date_year_format: "yyyy",
        date_year_month_format: "yyyy/MM",
        date_month_format: "MM",
        date_day_format: "dd",
        lang_mesg_month: "Month",
        lang_mesg_week: "Week",
        lang_mesg_day: "Day",
        lang_mesg_standard: "Standard",
        lang_mesg_narrow: "Narrow",
    };
}

// テーブル列のAlign
const align_list = {
    center: "center",
    left: "left",
    right: "right"
} as const;
// ガントチャートのテーブル部のカラム設定のデータ定義
export interface IGppGanttColumns {
    align: typeof align_list[keyof typeof align_list];  // alignに指定できる文字列を限定
    width: number;
    id: string;
    name: string;
}

// ガントチャートのダータ型定義
export interface IGppGanttData {
    id: number;
    name: string;
    level: null|number;
    start_date?: Date;
    end_date?: Date;
    duration?: number;
    progress?: number;
    bar_color?: string;
    bar_stroke_color?: string;
}
// リンクタイプ
const link_type_list = {
    s2s: "s2s",
    s2e: "s2e",
    e2s: "e2s",
    e2e: "e2e",
} as const;
// リンクのデータ定義
export interface IGppGanttLink {
    id: number;
    source: number;
    target: number;
    type: typeof link_type_list[keyof typeof link_type_list];  // typeに指定できる文字列を限定
}

/**
 * ガントチャート表示データの管理クラス
 */
class CGppGanttDataManager {
    public config:IGppGanttConfig;
    public columns:IGppGanttColumns[];
    public data:IGppGanttData[];
    public links:IGppGanttLink[];

    public start_date: Date;
    public end_date: Date;

    // セルの幅と高さ
    public w:number = 0;
    public h:number = 0;
    public w_mark:number = 0;

    // ガントチャートエリアの幅と高さ
    public width:number = 0;
    public height:number = 0;
    
    // 表示単位別の計算をまとめた計算モジュールを取得
    private unit_culator:CGppGanttCalUnitCalculator;

    private id_index:number[] = [];

    // コンストラクタ
    constructor(config:IGppGanttConfig,columns:IGppGanttColumns[],data:IGppGanttData[],links:IGppGanttLink[]) {
        this.config = config;
        this.columns = columns;
        this.data = data;
        this.links = links;

        this.start_date = new Date();
        this.end_date = new Date();

        // セルの幅と高さ
        this.w_mark = config.cell_day_width;
        this.h = config.cell_height;
        if (this.config.calendar_unit == "day") {
            this.w = config.cell_day_width;
            this.unit_culator = new CDayGppGanttCalUnitCalculator(this);;
        } else if (this.config.calendar_unit == "week") {
            this.w = config.cell_week_width;
            this.unit_culator = new CWeekGppGanttCalUnitCalculator(this);
        } else if (this.config.calendar_unit == "month") {
            this.w = config.cell_month_width;
            this.unit_culator = new CMOnthGppGanttCalUnitCalculator(this);
        } else {
            throw new Error("Internal Error");
        }
    }

    // セットアップ
    public setup() {
        // start_date,end_dateの設定
        this._setStartEndDate();
        // インデックス作成
        this._makeIndex();

        // ガントチャートエリアの幅と高さ
        this.width = (this.getPeriodNums() + 1) * this.w;
        this.height = this.data.length * this.h;

        // セルの幅
        if (this.config.cell_width_class == "standard") {
            this.config.cell_day_width = this.config.cell_day_width_standard;
            this.config.cell_week_width = this.config.cell_week_width_standard;
            this.config.cell_month_width = this.config.cell_month_width_standard;
        } else if (this.config.cell_width_class == "narrow") {
            this.config.cell_day_width = this.config.cell_day_width_narrow;
            this.config.cell_week_width = this.config.cell_week_width_narrow;
            this.config.cell_month_width = this.config.cell_month_width_narrow;
        }
    }

    // start_date,end_dateの設定
    private _setStartEndDate():void {
        let max_date = new Date("1970-01-01");
        let min_date = new Date("2999-12-31");

        if (this.data.length == 0) {
            throw new Error('Internal Error');
        }

        if (this.config.start === null || this.config.end === null) {
            this.data.map((row) => { 
                if (row.start_date !== undefined) {
                    if (row.end_date != undefined && row.end_date > max_date) max_date = row.end_date;
                    if (row.start_date < min_date) min_date = row.start_date;
                }
            });
        }
        if (this.config.start !== null ) {
            this.start_date = this.config.start;
        } else {
            this.start_date = new Date(min_date.getTime());
        }
        if (this.config.end !== null ) {
            this.end_date = this.config.end;
        } else {
            this.end_date = new Date(max_date.getTime());
        }
        // 開始・終了日の調整
        this._ajustStartEndDate();
    }

    /**
     * 表示単位に合わせて開始、終了日を調整
     */
    public _ajustStartEndDate() {
        if (this.config.calendar_unit == "month") {
            this.start_date.setDate(1);
            this.end_date.setDate(1);
        } else if (this.config.calendar_unit == "week") {
            this.start_date.setDate(this.start_date.getDate()-this.start_date.getDay())
            this.end_date.setDate(this.end_date.getDate()-this.end_date.getDay());
        }
    }

    // インデックス作成
    private _makeIndex():void {
        for (let i:number = 0; i < this.data.length; i++) {
            this.id_index[this.data[i].id] = i;
        }
    }

    // データ個数を返す
    getDataLength():number {
        return this.data.length;
    }
    // リンク個数を取得
    getLinkLength():number {
        return this.links.length;
    }

    // Y座標を取得
    getYbyIndex(index:number):number {
        return index*this.h;
    }

    // X座標を取得
    getXbyIndex(index:number):null|{x1:number,x2:number,w:number,pw:number,duration:number,level:null|number} {
        if (this.data[index] !== undefined) {
            const start_date = this.data[index].start_date;
            const end_date = this.data[index].end_date;
            const duration = this.data[index].duration;
            const progress = this.data[index].progress;
            const level = this.data[index].level;
            if (start_date !== undefined && end_date !== undefined && duration !== undefined) {
                let sdidx = this.unit_culator.getDayIndex(start_date);
                let edidx = this.unit_culator.getDayIndex(end_date,"end");
                let x2:number;
                if (duration == 0) {
                    x2 = (sdidx)*this.w + this.w_mark;
                } else {
                    x2 = (edidx)*this.w;
                }
                let pw = 0;
                if (progress != undefined) {
                    pw = (edidx-sdidx)*progress/100;
                }
                return {x1:sdidx*this.w,x2:x2,w:(edidx-sdidx)*this.w,pw:pw*this.w,duration:duration,level:level};
            }
        }
        return null;
    }

    // バーの色を取得
    getColorsByIndex(index:number):{fill:string,stroke:string,progress:string} {
        let color:string = "";
        let st_color:string = "";
        let p_color:string = this.config.progress_fill_color;

        if (this.data[index] !== undefined) {
            const row = this.data[index];

            if (row.level != 99) {
                color = (row.bar_color !== undefined? row.bar_color : this.config.default_level_bar_fill_color);
                st_color = (row.bar_stroke_color !== undefined? row.bar_stroke_color : this.config.default_level_bar_stroke_color);
            } else if (row.duration === 0) {
                color = this.config.default_diamond_fill_color;
                st_color = this.config.default_diamond_stroke_color;
            } else {
                color = (row.bar_color !== undefined? row.bar_color : this.config.default_bar_fill_color);
                st_color = (row.bar_stroke_color !== undefined? row.bar_stroke_color : this.config.default_bar_stroke_color);
            }
        }
        return {fill:color,stroke:st_color,progress:p_color};
    }

    // ラベルの表示位置
    getLabelXbyIndex(index:number):null|{x:number,align:string,text:string} {
        let sx = this.getXbyIndex(index);
        if (sx !== null) {
            if (this.data[index] !== undefined) {
                const row = this.data[index];
                if (this.config.label_align == "center") {
                    return {x:sx.x1+sx.w/2,align:"middle",text:row.name};
                } else if (this.config.label_align == "right") {
                    return {x:sx.x2+2,align:"start",text:row.name};
                } else if (this.config.label_align == "left") {
                    return {x:sx.x1-2,align:"end",text:row.name};
                }
            }
        }
        return null;
    }

    // リンク線の色
    getLinkLineColor():string {
        return this.config.link_line_color;
    }

    // 作業名のインデント
    getNameIndent(row:IGppGanttData,id:string):number {
        if (id == "name") {
            if (row.level == 0) return 0;
            else if (row.level == 1) return this.config.level_indent;
            else return this.config.level_indent*2;
        }
        return 0;
    }

    // カラムの値を取得
    getValueByColId(row:IGppGanttData,id:string):string {
        let value:any = "";
        if (id == "id") {
            value = row.id;
        } else if (id == "name") {
            value = row.name;
        } else if (id == "start_date") {
            if (row.start_date !== undefined) {
                value = this.toDateString(row.start_date);
            }
        } else if (id == "end_date") {
            if (row.end_date !== undefined) {
                value = this.toDateString(row.end_date);
            }
        } else if (id == "duration") {
            if (row.duration !== undefined) {
                value = row.duration;
            }
        } else if (id == "progress") {
            if (row.progress !== undefined) {
                value = row.progress;
            }
        }
        return String(value);
    }

    // リンク線の座標取得
    getLinkLinePositionByIndex(index:number):null|{x1:number,y1:number,x2:number;y2:number} {
        if (this.links[index] !== undefined) {
            const yajust = this.h/2;
            const link = this.links[index];
            const sid = link.source;
            const tid = link.target;
            const sindex = this.id_index[sid];
            const tindex = this.id_index[tid];
            const sx = this.getXbyIndex(sindex);
            const sy  = this.getYbyIndex(sindex);
            const tx = this.getXbyIndex(tindex); 
            const ty  = this.getYbyIndex(tindex);
            if (sx !== null && tx !== null ) {
                if (link.type == "s2s") {
                    return {x1:sx.x1,    y1:sy+yajust,    x2:tx.x1,   y2:ty+yajust};
                } else if (link.type == "s2e") {
                    return {x1:sx.x1,    y1:sy+yajust,    x2:tx.x2,   y2:ty+yajust};
                } else if (link.type == "e2s") {
                    return {x1:sx.x2,    y1:sy+yajust,    x2:tx.x1,   y2:ty+yajust};
                } else if (link.type == "e2e") {
                    return {x1:sx.x2,    y1:sy+yajust,    x2:tx.x2,   y2:ty+yajust};
                } else {
                    throw new Error("internal error");
                }
            }
        }
        return null;
    }
    
    // 表示単位の計算モジュールを取得する
    getCalUnitCalCulator():CGppGanttCalUnitCalculator  {
        return this.unit_culator;
    }

    // 開始-終了の間の日数計算
    getPeriodNums():number {
        return this.unit_culator.getPeriodNums();
    }

    // Date型の日付をyyyy-MM-dd形式で文字列にする
    toDateString(date:Date):string {
        return format(date,this.config.date_format);
    }
    // 週番号を取得する
    getCalenderWeek(date:Date):string {
        // 月曜日の日付にする
        let dd:Date = new Date(date.getTime());
        dd.setDate(dd.getDate()-dd.getDay());
        // 1/1からの日数を計算
        const firstDayOfYear:Date = new Date(dd.getFullYear(), 0, 1);
        let pastDaysOfYear = Math.floor((dd.getTime() - firstDayOfYear.getTime()) / 86400000) + 1;
        let cw:number;
        cw = Math.floor((pastDaysOfYear / 7)+1);
        if (cw == 0) {
            cw = 53;
        }
        const cws = String(dd.getFullYear())+"-"+String(cw);
        return cws;
    }
}

/**
 * 表示単位の計算クラス
 */
class CGppGanttCalUnitCalculator {
    protected dm:CGppGanttDataManager;
    constructor(dm:CGppGanttDataManager) {
        this.dm = dm;
    }
    // 開始-終了の間の日数計算
    public getPeriodNums():number {
        return 0;
    }
    // dayがstart_dayから何日目かを計算
    public getDayIndex(date:Date,opt:string=""):number {
        return 1;
    }
    // 1行目の幅
    public get1stRowWidth(today:Date,i:number):null|number {
        return null;
    }
    // 1行目のラベル
    public get1stRowLabel(today:Date):string {
        return "";
    }
    // 2行目のラベル
    public get2ndRowLabel(today:Date):string {
        return "";
    }
    // 日付のインクリメント
    public getIncDate(today:Date):Date {
        return today;
    }
    // 背景色
    public getVerticalBgcolor(today:Date,i:number):null|string {
        if (i % 2 == 0) {
            // 偶数である
            return this.dm.config.calendar_even_bgcolor;
        }
        return null;
    }
}

// 月表示の場合
class CMOnthGppGanttCalUnitCalculator extends CGppGanttCalUnitCalculator {
    // 開始-終了の間の日数計算
    public getPeriodNums():number {
        // 開始と終了の年
        const st_y = this.dm.start_date.getFullYear();
        const ed_y = this.dm.end_date.getFullYear();
        // 開始と終了の月
        const st_m = this.dm.start_date.getMonth();
        const ed_m = this.dm.end_date.getMonth();
        // 年差と月差から月数を計算
        let months:number = (ed_y - st_y)*12 + (ed_m-st_m);
        // 10年以上なら10年を上限にする
        if (months > 12*10) return 12*10;
        return months;
    }

    // dayがstart_dayから何日目かを計算
    public getDayIndex(date:Date,opt:string=""):number {
        const st_year = this.dm.start_date.getFullYear();
        const st_month = this.dm.start_date.getMonth();
        const tg_year = date.getFullYear();
        const tg_month = date.getMonth();
        const tg_day = date.getDate();
        const tg_lastday = getEndOfYearDate(date).getDate();
        return (tg_year - st_year)*12 + (tg_month - st_month) + (tg_day/tg_lastday)
    }

    // 1行目の幅
    public get1stRowWidth(today:Date,i:number):null|number {
        if ((today.getMonth() == 0 && today.getDate() == 1) || today.getTime() == this.dm.start_date.getTime()) {
            // 年末の日付
            let end_of_day = getEndOfYearDate(today);
            // カレンダー最終日の場合の補正
            if (end_of_day > this.dm.end_date) {
                end_of_day = this.dm.end_date;
            }
            // 年のボックス表示
            const month_width:number = (end_of_day.getMonth() - today.getMonth() + 1) * this.dm.w;
            return month_width;
        }
        return null;
    }

    // 1行目のラベル
    public get1stRowLabel(today:Date):string {
        return format(today,this.dm.config.date_year_format);
    }
    // 2行目のラベル
    public get2ndRowLabel(today:Date):string {
        return format(today,this.dm.config.date_month_format);
    }
    // 日付のインクリメント
    public getIncDate(today:Date):Date {
        today.setMonth(today.getMonth()+1);
        return today;
    }
    // 背景色
    public getVerticalBgcolor(today:Date,i:number):null|string {
        if (format(today,"yyyy-MM") == format(new Date(),"yyyy-MM")){
            return this.dm.config.calendar_today_bgcolor;
        } else {
            return super.getVerticalBgcolor(today,i);
        }
    }
}

// 週示の場合
class CWeekGppGanttCalUnitCalculator extends CGppGanttCalUnitCalculator {
    // 開始-終了の間の日数計算
    public getPeriodNums():number {
        // 開始から終了までの日数を取得
        const days = (this.dm.end_date.getTime() - this.dm.start_date.getTime()) / (1000 * 60 * 60 * 24);
        const st_day = this.dm.start_date.getDay();
        const weeks = Math.floor(days + st_day)/7;
        // 5年以上なら5年にする
        if (weeks > 52*5) return 52*5;
        return weeks;
    }

    // dayがstart_dayから何日目かを計算
    public getDayIndex(date:Date,opt:string=""):number {
        let idx = (date.getTime() - this.dm.start_date.getTime()) / (1000 * 60 * 60 * 24);
        return idx/7;
    }

    // 1行目の幅
    public get1stRowWidth(today:Date,i:number):null|number {
        if (today.getDate() <= 7 || today.getTime() == this.dm.start_date.getTime()) {
            // 月末の日付
            let end_of_day = getEndOfMonthDate(today);
            // カレンダー最終日の場合の補正
            if (end_of_day > this.dm.end_date) {
                end_of_day = this.dm.end_date;
            }
            // 月のボックス表示
            const month_width:number = Math.floor((end_of_day.getDate() - today.getDate())/7 + 1) * this.dm.w;
            return month_width;
        }
        return null;
    }
    // 1行目のラベル
    public get1stRowLabel(today:Date):string {
        return format(today,this.dm.config.date_year_month_format);
    }
    // 2行目のラベル
    public get2ndRowLabel(today:Date):string {
        return format(today,this.dm.config.date_day_format);
    }
    // 日付のインクリメント
    public getIncDate(today:Date):Date {
        today.setDate(today.getDate()+7);
        return today;
    }
    // 背景色
    public getVerticalBgcolor(today:Date,i:number):null|string {
        const today2 = new Date();
        if (this.dm.getCalenderWeek(today) == this.dm.getCalenderWeek(today2)) {
            return this.dm.config.calendar_today_bgcolor;
        } else {
            return super.getVerticalBgcolor(today,i);
        }
    }
}

// 日表示の場合
class CDayGppGanttCalUnitCalculator extends CGppGanttCalUnitCalculator {
    // 開始-終了の間の日数計算
    public getPeriodNums():number {
        // 開始から終了までの日数を取得
        const days = (this.dm.end_date.getTime() - this.dm.start_date.getTime()) / (1000 * 60 * 60 * 24);
        // 2年以上なら2年を上限にする
        if (days > 365*2) return 365*2;
        return days;
    }

    // dayがstart_dayから何日目かを計算
    public getDayIndex(date:Date,opt:string=""):number {
        let idx = (date.getTime() - this.dm.start_date.getTime()) / (1000 * 60 * 60 * 24);
        if (opt == "end") {
            idx+=1;
        }
        return idx;
    }

    // 1行目の幅
    public get1stRowWidth(today:Date,i:number):null|number {
        if (today.getDate() == 1 || today.getTime() == this.dm.start_date.getTime()) {
            // 月末の日付
            let end_of_day = getEndOfMonthDate(today);
            // カレンダー最終日の場合の補正
            if (end_of_day > this.dm.end_date) {
                end_of_day = this.dm.end_date;
            }
            // 月のボックス表示
            const month_width:number = (end_of_day.getDate() - today.getDate() + 1) * this.dm.w;
            return month_width;
        }
        return null;
    }
    // 1行目のラベル
    public get1stRowLabel(today:Date):string {
        return format(today,this.dm.config.date_year_month_format);
    }
    // 2行目のラベル
    public get2ndRowLabel(today:Date):string {
        return format(today,this.dm.config.date_day_format);
    }
    // 日付のインクリメント
    public getIncDate(today:Date):Date {
        today.setDate(today.getDate()+1);
        return today;
    }
    // 縦の背景色
    public getVerticalBgcolor(today:Date,i:number):null|string {
        if (this.dm.toDateString(today) == this.dm.toDateString(new Date())) {
            return this.dm.config.calendar_today_bgcolor;
        } else if (today.getDay() === 0) {
            return this.dm.config.calendar_sunday_bgcolor;
        } else if (today.getDay() === 6) {
            return this.dm.config.calendar_satday_bgcolor;
        } else if (this.dm.config.holidaies.includes(this.dm.toDateString(today))) {
            return this.dm.config.calendar_holiday_bgcolor;
        }
        return null;
    }
}


//export const GanttTableCell = styled(Box)({
const GanttTableCell = styled(TableCell)({
  padding: 0,
  margin: 0,
  paddingLeft: 2,
  paddingRight: 2,
})


/**
 * ガントチャートのテーブル部分のヘッダー部
 */
function GppGanttTableHeader(props:GppGanttChartInternalProps) {
    const {dm} = props;
    
    return (
      <Box sx={{position:"sticky",top:0,backgroundColor:"white"}}>
      <Table>
        <TableHead>
          <TableRow>
                <GanttTableCell sx={{height:dm.h}} ></GanttTableCell>
          </TableRow>
          <TableRow>
            {dm.columns.map((col)=>{
                return (<GanttTableCell sx={{height:dm.h,width:col.width}} align={col.align} >
                {col.name}
                </GanttTableCell>);
            })}
          </TableRow>
        </TableHead>
      </Table>
      </Box>
    );
}

/**
 * ガントチャートのテーブル部分のボディー部
 */
function GppGanttTableBody(props:GppGanttChartInternalProps) {
    const {dm} = props;

    return (
      <Table>
        <TableBody>
          {dm.data.map((row) => { 
                return (
                    <TableRow>
                    {dm.columns.map((col) => {
                        return (
                        <GanttTableCell sx={{height:dm.h-1,maxWidth:col.width,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} align={col.align} 
                                        onClick={(event) => {
                                            if (props.onClickTask !== undefined) props.onClickTask(dm.getValueByColId(row,"id"));
                                        }}>
                            <Box sx={{marginLeft:dm.getNameIndent(row,col.id),padding:0}}>{dm.getValueByColId(row,col.id)}</Box>
                        </GanttTableCell>
                        );
                    })}
                    </TableRow>)
                }
            )}
        </TableBody>
      </Table>
    );    
}

/**
 * ガントチャートのカレンダー部のヘッダー部
 */
function GppSvgGanttChartHeader(props:GppGanttChartInternalProps) {
    const {dm} = props;
    let today:Date = new Date;
    let cel_nums:number = dm.getPeriodNums();
    const viewbox:string = "0 0 "+String(dm.width)+" "+String(dm.h*2);

    let vbgfill:ReactNode[] = [];
    let vlines:ReactNode[] = [];
    let color:null|string;

    // 表示単位別の計算をまとめた計算モジュールを取得
    const unit_culator = dm.getCalUnitCalCulator();

    // 日付オブジェクトのクローン
    today.setTime(dm.start_date.getTime());
    let label:string;
    for (let i:number = 0; i <= cel_nums; i++) {
        // 上段部分の描画
        const month_width:null|number = unit_culator.get1stRowWidth(today,i);
        if (month_width !== null) {
            label = unit_culator.get1stRowLabel(today);
            vlines.push(<rect x={i*dm.w} y={0} width={month_width} height={dm.h} fill="transparent" stroke={dm.config.grid_boarder_color}></rect>);
            vlines.push(<text x={i*dm.w + month_width/2} y={dm.h/2} alignment-baseline="middle" text-anchor="middle" font-size="14" >{label}</text>);
        }
        // 下段部分の描画
        color = unit_culator.getVerticalBgcolor(today,i);
        if (color !== null) {
            vbgfill.push(<rect x={i*dm.w} y={dm.h} width={dm.w} height={dm.h} fill={color}/>);
        }
        label = unit_culator.get2ndRowLabel(today);
        vlines.push(<line x1={i*dm.w} y1={dm.h} x2={i*dm.w} y2={dm.h*2} stroke={dm.config.grid_boarder_color}/>);
        vlines.push(<text x={i*dm.w + dm.w/2} y={dm.h/2+dm.h} alignment-baseline="middle" text-anchor="middle" font-size="14" >{label}</text>);

        // 日付のインクリメント
        today = unit_culator.getIncDate(today);
    }

    return (
        <Stack alignItems="stretch" sx={{position:"sticky",top:0,marginBottom:0.5}}>
            <svg width={dm.width} height={dm.h*2} viewBox={viewbox} preserveAspectRatio="xMidYMid slice" role="img" style={{backgroundColor:"white"}}>
                <rect x={0} y={0} width={dm.width} height={dm.h*2} fill="transparent" stroke={dm.config.grid_boarder_color}></rect>
                {vbgfill}
                {vlines}
            </svg>
        </Stack>
    ); 
}

/**
 * ガントチャートのカレンダー部のボディー部
 */
function GppSvgGanttChartBody(props:GppGanttChartInternalProps) {
    const {dm} = props;
    // 開始-終了の間の日数
    let cel_nums:number = dm.getPeriodNums();
    const viewbox:string = "0 0 "+String(dm.width)+" "+String(dm.height);

    // 表示単位別の計算をまとめた計算モジュールを取得
    const unit_culator = dm.getCalUnitCalCulator();

    let vbgfill = [];
    let vlines = [];
    let color:null|string;
    let today:Date = new Date;
    today.setTime(dm.start_date.getTime());
    for (let i:number = 0; i <= cel_nums; i++) {
        color = unit_culator.getVerticalBgcolor(today,i);
        if (color !== null) {
            vbgfill.push(<rect x={i*dm.w} y="0" width={dm.w} height={dm.height} fill={color}/>);
        }
        vlines.push(<line x1={i*dm.w} y1="0" x2={i*dm.w} y2={dm.height} stroke={dm.config.grid_boarder_color}/>);
        today = unit_culator.getIncDate(today);
    }

    let hlines = [];
    for (let i=0;i <= dm.data.length; i++ ) {
        hlines.push(<line x1="0" y1={i*dm.h} x2={dm.width} y2={i*dm.h} stroke={dm.config.grid_boarder_color}/>);
    }

    // バー表示
    let bars = GppSvgGanttChartBars(props.dm);
    // リンク線
    let linklines = GppSvgGanttChartLinkLines(props.dm);

    return (
        <svg width={dm.width} height={dm.height} viewBox={viewbox} preserveAspectRatio="xMidYMid slice" role="img">
            <defs>
                <marker id="arrow" viewBox="0 0 6 6" refX="3" refY="3"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L6,3 L0,6 Z" fill="red" opacity="0.5" />
                </marker>
            </defs>
            {vbgfill}
            {hlines}
            {vlines}
            {bars}
            {linklines}
        </svg>
    ); 
}

/**
 * バーを描画する
 */
function GppSvgGanttChartBars(dm:CGppGanttDataManager):ReactNode[] {
    let bars:ReactNode[] = [];

    for(let i:number = 0; i < dm.getDataLength(); i++) {
        let xs = dm.getXbyIndex(i);
        let y = dm.getYbyIndex(i);
        let lxs = dm.getLabelXbyIndex(i);
        if (xs !== null && lxs !== null) {
            // バーの色
            // バーの描画
            let colors = dm.getColorsByIndex(i);
            if (xs.level != 99) {
                bars.push(GppSvgGanttChartLevelBar(xs.x1,y+dm.h/4,xs.w,dm.h/2,colors.fill,colors.stroke));
                bars.push(GppSvgGanttChartProgressBar(xs.x1+2,y+dm.h/4+2,xs.pw-4,dm.h/2-4,colors.progress));
                bars.push(GppSvgGanttChartLabel(lxs.x,y+dm.h/2,lxs.text,lxs.align));
            } else if (xs.duration === 0) {
                bars.push(GppSvgGanttChartDiamond(xs.x1+2,y+4,dm.w_mark-4,dm.h-4,colors.fill,colors.stroke));
                bars.push(GppSvgGanttChartLabel(lxs.x,y+dm.h/2,lxs.text,lxs.align));
            } else {
                bars.push(GppSvgGanttChartBar(xs.x1,y+dm.h/4,xs.w,dm.h/2,colors.fill,colors.stroke));
                bars.push(GppSvgGanttChartProgressBar(xs.x1+2,y+dm.h/4+2,xs.pw-4,dm.h/2-4,colors.progress));
                bars.push(GppSvgGanttChartLabel(lxs.x,y+dm.h/2,lxs.text,lxs.align));
            }
        }
    }

    return bars; 
}

// リンク線の描画
function GppSvgGanttChartLinkLines(dm:CGppGanttDataManager):ReactNode[] {
    let lines:ReactNode[] = [];

    for(let i:number = 0; i < dm.getLinkLength(); i++) {
        let xy = dm.getLinkLinePositionByIndex(i);
        if (xy !== null) {
            // バーの色
            // バーの描画
            const color = dm.getLinkLineColor();
            lines.push(GppSvgGanttChartLine(xy.x1,xy.y1,xy.x2,xy.y2,color));
        }
    }
    return lines;
}

// レベルバー
function GppSvgGanttChartLevelBar(x:number,y:number,w:number,h:number,fill:string,stroke:string) {
    let points:string = "";
    points += String(x)+","+String(y)+" ";
    points += String(x+w)+","+String(y)+" ";
    points += String(x+w)+","+String(y+h)+" ";
    points += String(x+w-6)+","+String(y+h-6)+" ";
    points += String(x+6)+","+String(y+h-6)+" ";
    points += String(x)+","+String(y+h)+" ";
    return(<polygon points={points} fill={fill} stroke={stroke} rx="5"></polygon>);
}
// バー
function GppSvgGanttChartBar(x:number,y:number,w:number,h:number,fill:string,stroke:string) {
    return(<rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} rx="5"></rect>);
}
// プログレスバー
function GppSvgGanttChartProgressBar(x:number,y:number,w:number,h:number,fill:string) {
    return(<rect x={x} y={y} width={w} height={h} fill={fill}></rect>);
}
// ラベル文字列
function GppSvgGanttChartLabel(x:number,y:number,text:string,align:string) {
    return (<text x={x} y={y} alignment-baseline="middle" text-anchor={align} font-size="14" >{text}</text>);
}
// ひし形
function GppSvgGanttChartDiamond(x:number,y:number,w:number,h:number,fill:string,stroke:string) {
    let points:string = "";
    points += String(x)+","+String(y+h/2)+" ";
    points += String(x+w/2)+","+String(y)+" ";
    points += String(x+w)+","+String(y+h/2)+" ";
    points += String(x+w/2)+","+String(y+h);
    return(<polygon points={points} fill={fill} stroke={stroke} rx="5"></polygon>);
}
// リンク線
function GppSvgGanttChartLine(x1:number,y1:number,x2:number,y2:number,stroke:string) {
    return (<line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} stroke-width="2" marker-end="url(#arrow)"/>);
}

// Propsの型
export type GppGanttChartProps = {
    width: number;
    height: number;
    config: IGppGanttConfig;
    columns: IGppGanttColumns[],
    data: IGppGanttData[],
    links: IGppGanttLink[],
    onClickTask?: (id:string)=>void,       // タスクをクリックしたときに呼ばれるオールバック
}

type GppGanttChartInternalProps = {
    dm: CGppGanttDataManager;
    onClickTask?: (id:string)=>void,       // タスクをクリックしたときに呼ばれるオールバック
}

// Propsの型
type SelectScaleProps = {
  dm: CGppGanttDataManager;
  unit: string;
  width_class: string;
  setUnit: (unit:string) => void;
  setWidth: (width:string) => void;
}

// 表示スケールの変更
function SelectScale(props:SelectScaleProps) {
    return (
        <Grid container spacing={1} justifyContent="flex-end" sx={{width:1}}>
            <Button variant={props.width_class=="standard"? "contained":"outlined"} sx={{padding:0}} onClick={(e)=>{props.setWidth("standard")}}>{props.dm.config.lang_mesg_standard}</Button>
            <Button variant={props.width_class=="narrow"? "contained":"outlined"} sx={{padding:0}} onClick={(e)=>{props.setWidth("narrow")}}>{props.dm.config.lang_mesg_narrow}</Button>
            <Button variant={props.unit=="month"? "contained":"outlined"} sx={{padding:0}} onClick={(e)=>{props.setUnit("month")}}>{props.dm.config.lang_mesg_month}</Button>
            <Button variant={props.unit=="week"? "contained":"outlined"} sx={{padding:0}} onClick={(e)=>{props.setUnit("week")}}>{props.dm.config.lang_mesg_week}</Button>
            <Button variant={props.unit=="day"? "contained":"outlined"} sx={{padding:0}} onClick={(e)=>{props.setUnit("day")}}>{props.dm.config.lang_mesg_day}</Button>
        </Grid>);
}

/**
 * Gppガントチャート
 */
export function GppGanttChart(props:GppGanttChartProps) {
    const [unit,setUnit] = useState<string>(props.config.calendar_unit);
    const [width_class,setWidthClass] = useState<string>(props.config.cell_width_class);
    const tableEl = useRef<HTMLDivElement>(null);
    const calendarEl = useRef<HTMLDivElement>(null);

    // 列の表示単位
    if (unit == "day" || unit == "week" || unit == "month") {
        props.config.calendar_unit = unit;
    }
    // 列幅
    if (width_class == "standard" || width_class == "narrow") {
        props.config.cell_width_class = width_class;
    }
    let dm:CGppGanttDataManager = new CGppGanttDataManager(props.config,props.columns,props.data,props.links);
    dm.setup();
  
    const cal_width = props.width-350;

    // スクロール連動
    const handleScroll = (left:boolean) => {
        if (tableEl.current != null && calendarEl.current != null ) {
            if (left == true) {
                calendarEl.current.scrollTop = tableEl.current.scrollTop;            
            } else {
                tableEl.current.scrollTop = calendarEl.current.scrollTop;            
            }
        }
    }
  
    return (
        <Stack direction={"column"} spacing={0.5}>
            <SelectScale dm={dm} unit={unit} setUnit={setUnit} width_class={width_class} setWidth={setWidthClass}/>
            <Stack direction={"row"} spacing={0.5}>
                <Box ref={tableEl} onScroll={()=>{handleScroll(true)}} sx={{width:400,overflowY:'auto',overflowX:"scroll",height:props.height}}>
                    <Stack direction={"column"} spacing={0}>
                        <GppGanttTableHeader dm={dm}/>
                        <GppGanttTableBody dm={dm} onClickTask={props.onClickTask} />
                    </Stack>
                </Box>
                <Box ref={calendarEl} onScroll={()=>{handleScroll(false)}} sx={{width:cal_width ,overflow: 'auto',height:props.height}} >
                    <Stack direction={"column"} spacing={0}>
                        <GppSvgGanttChartHeader  dm={dm}/>
                        <GppSvgGanttChartBody  dm={dm}/>
                    </Stack>
                </Box>
            </Stack>
        </Stack>
    );
}