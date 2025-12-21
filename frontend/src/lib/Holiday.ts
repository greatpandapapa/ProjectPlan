import {
    DataJson,
    IHoliday,
} from "../lib/typings";
import {
    CBaseListItem,
    CBaseList
} from "./BaseList";
import {CPlan} from "./Plan";
import { format } from "date-fns";
import dayjs, { Dayjs } from 'dayjs';

/**
 * 作業者
 */
export class CHolidayList extends CBaseList<CHoliday> {
    list: CHoliday[] = [];

    /**
     * コンストラクタ
     * 
     * @param data JSONデータ
     */
    constructor(data: DataJson) {
        super();
         for (let dt of data.holiday) {
            this.list.push(this._factoryObject(dt));
        }
    }

    /**
     * 空オブジェクトの生成（継承先でオーバーライトする）
     */
    protected override _factoryObject(data:IHoliday):CHoliday {
        return new CHoliday(data);
    }

    /**
     * 新規データを生成する
     */
    public getNewTableRow():IHoliday {
        return {...new CHoliday()};
    }

    /**
     * テーブル出力用のデータを生成する
     * 
     * @param id 
     * @returns 
     */
    public getHolidayTableRow(id:number):IHoliday {
        let dt:CHoliday = this.getData(id);
        let row:IHoliday = dt;
        return row;
    }

    /**
     * 重複データを削除
     */
    public deleteDuplicatData() {
        let already:boolean[] = [];
        let time:number;
        for (let i:number = 0; i < this.list.length; i++) {
            time = this.list[i].date.getTime();
            if (already[time]) {
                this.list.splice(i,1);
                i--;                
            } else {
                already[time] = true;
            }
        }
    }

    /**
     * 日付の配列を取得
     */
    public getDays():string[] {
        let days:string[] = [];
        this.list.map((dd) => {
            days.push(format(dd.date,"yyyy-MM-dd"));

        })
        return days;
    }

    /**
     * 次の稼働日を取得
     */
    public getNextWorkday(today:Date,duration:number,vect:string):Date {
        const holidaies:string[] = this.getDays();

        let unit:number;
        if (vect == "forward") {
            unit = 1;
        } else if (vect == "back") {
            unit = -1;
        } else {
            throw new Error("Internal error");
        }
        let nextday:Date = today;
        for(let i:number = 0; i < duration;i++) {
            nextday = dayjs(nextday).add(unit,"d").toDate();
            if (nextday.getDay() === 0 || nextday.getDay() === 6) {
                i--;
            } else if (holidaies.includes(format(nextday, "yyyy-MM-dd"))) {
                i--;
            }
        }
        return nextday;
    }
}

/**
 * 目的
 */
export class CHoliday extends CBaseListItem implements IHoliday {
    // プロパティ
    date: Date = new Date();

    constructor(data?: IHoliday) {
        // 最初にsuperを呼んでおく必要あり
        super({id:0});
        if (data != undefined) {
            this.id = data.id;
            this.date = new Date(data.date);
        }
    }

    public update(data: IHoliday) {
        this.date = data.date;
    }

    public getData():IHoliday {
        return {
            ...this
        };
    } 
}
