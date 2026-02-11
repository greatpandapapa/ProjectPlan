import {
    DataJson,
    IValueOptions,
    IWorker,
} from "../lib/typings";
import {
    CBaseListItem,
    CBaseList
} from "./BaseList";
import {CPlan} from "./Plan";

/**
 * 作業者
 */
export class CWorkerList extends CBaseList<CWorker> {
    list: CWorker[] = [];

    /**
     * コンストラクタ
     * 
     * @param data JSONデータ
     */
    constructor(plan:CPlan, data: DataJson) {
        super(plan);
         for (let dt of data.worker) {
            this.list.push(this._factoryObject(dt));
        }
    }

    /**
     * 空オブジェクトの生成（継承先でオーバーライトする）
     */
    protected override _factoryObject(data:IWorker):CWorker {
        return new CWorker(data);
    }

    /**
     * 新規データを生成する
     */
    public getNewTableRow():IWorker {
        return {...new CWorker()};
    }

    /**
     * SelectのValueOptionを生成する
     * 
     * @returns 
     */
    public getWorkerValueOptions():IValueOptions[] {
        let options:IValueOptions[] = [];
        options.push({value:"",label:""});
        for (let dt of this.list) {
            options.push({value:dt.id,label:dt.name});
        }
        return options;
    }

    /**
     * テーブル出力用のデータを生成する
     * 
     * @param id 
     * @returns 
     */
    public  getWorkerTableRow(id:number):IWorker {
        let dt:CWorker = this.getData(id);
        let row:IWorker = {...dt};
        return row;
    }
}

/**
 * 目的
 */
export class CWorker extends CBaseListItem implements IWorker {
    // プロパティ
    type: string = "";
    name: string = "";
    color: string = "";

    constructor(data?: IWorker) {
        // 最初にsuperを呼んでおく必要あり
        super({id:0});
        if (data != undefined) {
            this.id = data.id;
            this.type = data.type;
            this.name = data.name;
            this.color = data.color;
        }
    }

    public update(data: IWorker) {
        this.type = data.type;
        this.name = data.name;
        this.color = data.color;
    }

    public getData():IWorker {
        return {
            ...this
        };
    } 
}
