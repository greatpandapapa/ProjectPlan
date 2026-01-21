import dayjs, { Dayjs } from 'dayjs';
import {
    DataJson,
    IWorker,
    ITask,
    ITaskRows,
    ITaskTable,
    IValueOptions,
    IPlan,
    ITaskNestedTable,
    IUpdateTask,
} from "./typings";
import ja from 'dayjs/locale/ja';
import { isInvalidDate } from "./Common";
import { toDateString,toDateTimeString,getTodayDateString,getTodayDateTimeString } from "./Common";
import {CPlan} from "./Plan";
import { CHolidayList } from './Holiday';

/**
 * スケジュールのリストを管理するクラス
 */
export class CTaskList {
    // プライベート
    private plan: CPlan;
    private task: CTask[] = [];
    private max_id: number; // taskのIDの最大値
    private latest_id: number; // 最後のID

    /**
     * コンストラクタ
     * 
     * @param data JSONデータ
     */
    constructor(plan:CPlan, data: DataJson) {
        this.max_id = 0;
        for (let sc of data.task) {
            this.task.push(new CTask(plan,sc));
        }
        this.latest_id = 0;
        this.plan = plan;
    }

    /**
     * CSVデータでTaskデータを読み込む
     * 
     * @param csv 
     * @returns 
     */
    public loadCSV(csv:string[][]) {

        const headers = csv.shift();
        if (headers === undefined) {
            return;
        }
        // タスクをクリア
        this.task = [];
        let id:number = 1;
        let pre_id:null|number = null; // スタートポイントはnullのため
        // CSVを読み込む
        csv.map((row)=>{
            let sc:ITask = this._getBrankData(id,pre_id);
            // 必須項目のチェック
            let reqs:number = 0;
            for(let i=0;i<headers.length;i++) {
                let key = headers[i];
                let value = row[i];
                if (row.length < i) continue;
                if (value == "") continue;
                switch(key) {
                    case "start_date_auto":
                        if (! this.plan.isAutoValidKey(value)) continue; // 正しい値かチェック
                        sc.start_date_auto = value;
                        reqs++; // 1
                        break;
                    case "start_date":
                        if (isNaN((new Date(value)).getTime())) continue; // 日付フォーマットチェック
                        sc.start_date = value;
                        reqs++; // 2
                        break;
                    case "end_date":
                        if (isNaN((new Date(value)).getTime())) continue; // 日付フォーマットチェック
                        sc.end_date = value;
                        break;
                    case "duration":
                        if (isNaN(Number(value))) continue; // 数値フォーマットチェック
                        sc.duration = Number(value);
                        reqs++; // 3
                        break;
                    case "type":
                        if (! this.plan.isTypeValidKey(value)) continue; // 正しい値かチェック
                        sc.type = value;
                        reqs++; // 4
                        break;
                    case "name":
                        sc.name = value;
                        reqs++; // 5
                        break;
                    case "memo":
                        sc.memo = value;
                        break;
                    case"level":
                        if (isNaN(Number(value))) continue; // 数値フォーマットチェック
                        sc.level = Number(value);
                        break;
                    case"progress":
                        if (isNaN(Number(value))) continue; // 数値フォーマットチェック
                        sc.progress = Number(value);
                        break;
                    case"ticket_no":
                        sc.ticket_no = value;
                        break;
                }
            }
            // 5つの必須項目がないと登録しない
            if (reqs >= 5) {
                id++;
                pre_id === null ? pre_id=1:pre_id++;
                this.task.push(new CTask(this.plan,sc));
            }
        });
    }

    /**
     * 最大ID,最終IDを探す
     */
    private _checkMaxLatestId() {
        let sc: CTask|null
        const sorted_idx = this._getSortedIndex();
        this.max_id = 0;
        sorted_idx.map((idx)=>{
            sc = this.task[idx];
            if (this.max_id < sc.id) {
                this.max_id = sc.id;
            }
            this.latest_id = sc.id;
        });
    }

    /**
     * リスト順番にソートされたインデックスの配列を返す
     * 
     * @returns インデックスの配列
     */
    private _getSortedIndex():number[] {
        let id  = this._searchStartID();
        let idx = this._getIndexById(id);
        if (idx == null) {
            throw new Error("can't get task:"+id);
        }
        let sc = this.task[idx];
        let sorted_idx:number[] = [idx];

        let i:number = 0;
        while((idx = this._getIndexByPreId(sc.id)) != null) {
            sorted_idx.push(idx);
            sc = this.task[idx];
            if (i++ > 1000) throw new Error("loop over 1000!");
        }
        return sorted_idx;
    }

    /**
     * TaskPanelのDataGrid用のデータを生成する
     */
    public getTaskRows():ITaskRows[] {
        let sc: CTask;
        let rows: CTask[] = [];

        let no:number = 1;
        let grp_id: number = 0;

        const sorted_idx = this._getSortedIndex();
        for(let i=0;i<sorted_idx.length;i++) {
            let idx:number = sorted_idx[i];
            sc = this.task[idx];
            sc.no = no++;
            sc.grp_id = sc.id;
            rows.push(sc);
        }

        // autoの時間計算（前）
        for(let i = 0; i < rows.length; i++) {
            rows[i].setDateNormal();
            if (i > 0) rows[i].setDatePre(rows[i-1]);
        }
        // autoの時間計算(後)
        for(let i = rows.length-2; i > 0; i--) {
            rows[i].setDatePost(rows[i+1]);
        }
        // grp_idを1番から付け直す
        let pre_grp_id = rows[0].grp_id;
        grp_id = 1;
        rows[0].grp_id = grp_id;
        // level=TOP/SUBの調整
        let top_idx:null|number = null;
        let top_cnt:number = 0;
        let sub_idx:null|number = null;
        let sub_cnt:number = 0;
        for(let i = 0; i < rows.length; i++) {
            if (i > 0) {
                // grp_idをつける
                if (pre_grp_id != rows[i].grp_id) {
                    grp_id++;
                    pre_grp_id = rows[i].grp_id;
                }
                rows[i].grp_id = grp_id;
            }
            // TOP/SUBの更新
            if (rows[i].level == 0) {
                top_idx = i;
                top_cnt = 0;
                sub_idx = null;
            } else if (rows[i].level == 1) {
                sub_idx = i;
                sub_cnt = 0;
            } else {
                if (top_idx !== null) {
                    rows[top_idx].updateTopDate(rows[i],top_cnt);
                    top_cnt++;
                }
                if (sub_idx !== null) {
                    rows[sub_idx].updateTopDate(rows[i],sub_cnt);
                    sub_cnt++;
                }
            }
        }
        return rows;
    }

    /**
     * スタート地点となるIDを検索する
     * 
     * pre_idがNULLのエントリが開始点
     * 複数ある場合は最初に見つかったもの
     * 
     * @returns id
     */
    private _searchStartID() {
        for (let sc of this.task) {
            if (sc.pre_id == null) {
                return sc.id;
            }
        }
        throw new Error("can't found start id");
    }

    /**
     * idもしくはpre_idを検索する
     * 
     * @param id IDを指定する
     * @param opt "id" or "pre_id" 検索対象を指定する
     * @returns task
     */
    private _getIndexById(id:number,opt:string = "id"):number|null {
        let i = 0;
        for (let sc of this.task) {
            if (opt == "id" && sc.id == id) {
                return i;
            }
            if (opt == "pre_id" && sc.pre_id == id) {
                return i;
            }
            i++;
        }
        return null;;
    }
    private _getIndexByPreId(id:number):number|null {
        return this._getIndexById(id,"pre_id");
    }


    /**
     * ソートされたIDを取得する
     */
    public getSortedIds():number[] {
        let sc: CTask;
        let ids:number[] = [];

        const sorted_idx = this._getSortedIndex();
        for(let i=0;i<sorted_idx.length;i++) {
            let idx:number = sorted_idx[i];
            sc = this.task[idx];
            ids.push(sc.id);
        }
        return ids;
    }

    /**
     * グループの最後のIDを取得する
     * 
     * グループの先頭出ない場合はそのIDを返す
     */
    public getGroupEndId(id:number):number {
        const idx = this._getIndexById(id);
        if (idx == null) {
            throw new Error("id not found:"+id);
        }
        if (this.task[idx].start_date_auto == "pre") {
            return id;
        } else {
            return this._getGroupEndId(id);
        }
    }
    private _getGroupEndId(id:number):number {
        const pre_idx = this._getIndexByPreId(id);
        if (pre_idx == null) {
            // 最後のスケジュールなら
            return id;
        } else {
            if (this.task[pre_idx].start_date_auto == "pre") {
                return this._getGroupEndId(this.task[pre_idx].id);
            } else {
                // 次のスケジュールのstart_date_autoがfalseなら最後
                return id;
            }
        }
    }

    /**
     * 新規データを生成する
     * 
     * @param target_id target_idの次の行に追加する
     */
    public addTask(target_id:number):number {
        this._checkMaxLatestId();
        let idx = this._getIndexByPreId(target_id);
        let new_id = this.max_id+1;
        let json:ITask = this._getBrankData(new_id,target_id);
        this.task.push(new CTask(this.plan, json));
        if (idx != null) {
            this.task[idx].pre_id = new_id;
        }
        return new_id;
    }

    /**
     * ブランクのデータ取得
     */
    private _getBrankData(new_id:number,target_id:null|number):ITask  {
        return {
            "id": new_id,
            "pre_id": target_id,
            "start_date_auto": "normal",
            "start_date": getTodayDateString(),
            "end_date": getTodayDateString(),
            "duration": 0,
            "type": "normal",
            "name": "",
            "master_milestone": null,
            "worker_id": null,
            "memo": "",
            "level": 99,
            "progress": 0,
            "ticket_no": "",
            "link_type": "",
            "link_id": null
        };
    }

    /**
     * タスクの情報を取得する
     * 
     * @param id 取得するID
     */
    public getTask(id:number):ITask {
        const idx = this._getIndexById(id);
        if (idx !== null) {
            const task:ITask = {...this.task[idx]};
            return task;
        } else {
            throw new Error("Internal Error");
        }
    }


    /**
     * タスクの情報を取得する
     * 
     * @param id 取得するID
     */
    public getTaskRow(id:number):ITaskRows {
        const idx = this._getIndexById(id);
        if (idx !== null) {
            return this.task[idx];
        } else {
            throw new Error("Internal Error");
        }
    }

    /**
     * スケジュールを追加・更新する
     * 
     * @param data スケジュール情報の配列
     */
    public updateTask(data:ITaskRows) {
        let idx:number|null;
        let data2: ITask = data as ITask;

        // invalid Date対策
        if ( ! isInvalidDate(data.start_date2)) {
            data.start_date = toDateString(data.start_date2);
        } else {
            data.start_date2 = new Date(data.start_date);
        }
        if ( ! isInvalidDate(data.end_date2)) {
            data.end_date = toDateString(data.end_date2);
        } else {
            data.end_date2 = new Date(data.end_date);
        }

        if (data2.pre_id != null) {
            idx = this._getIndexByPreId(data2.pre_id);
            if (idx != null) {
                this.task[idx].pre_id = data2.id;                
            }
        }

        // データの登録・更新
        idx = this._getIndexById(data2.id);
        if (idx == null) {
            this.task.push(new CTask(this.plan,data2));
            idx = this.task.length - 1;
        } else {
            this.task[idx].update(data2);
        }
        this.task[idx].setDateStartEnd(this.plan.holidaies);
    }

    /**
     * IDを削除する
     */
    public delTask(id:number) {
        let idx: number|null;
        let pre_id: number|null;

        // 最後の１件になったら削除できないようにする
        if (this.task.length == 1) {
            return;
        }
        // 削除するインデックス取得
        idx = this._getIndexById(id);
        if (idx == null) {
            throw new Error("can't get task by id:"+id);
        }
        pre_id = this.task[idx].pre_id;
        this.task.splice(idx, 1);

        // pre_idの連鎖を修正
        if (pre_id != null) {
            idx = this._getIndexByPreId(id);
            if (idx != null) {
                this.task[idx].pre_id = pre_id;
            }
        }
    }

    /**
     * スケジュールを移動させる
     * 
     * Dnd-kitのSortableで指定されたIDを引数に取っている。
     * 上から移動させてきたのか、下から移送させてきたのかで
     * worker_idの意味が違ってくる。
     * 
     * 下から移動させてきた（taget_idよりworker_idが前方にある）場合は、worker_idの前に挿入したい
     * 上から移動させてきた（taget_idよりworker_idが後方にある）場合は、worker_idの後に挿入したい
     * 
     * @param target_id 移動対象のスケジュール
     * @param worker_id 移動先のスケジュール
     */
    public moveTask(target_id:number,worker_id:number) {

        console.log("t:"+target_id,", d:"+worker_id);
        if (target_id == worker_id) {
            return;
        }

//        console.log("----before----");
//        this._printID();
        let destance = this.getDistance(target_id,worker_id);
        // target_idを最後に移動
        this._moveTaskToLast(target_id);
//        console.log("----step1----");
//        this._printID();
        if (destance < 0) {
            this._moveTaskLastleToDest(target_id,worker_id,true)
        } else if (destance > 0) {
            this._moveTaskLastleToDest(target_id,worker_id,false)
        }
//        console.log("----after----");
//        this._printID();
    }

    private _printID() {
        const sorted_ids = this._getSortedIndex();
        sorted_ids.map((idx)=>{
            console.log("ID:"+this.task[idx].id+", PID:"+this.task[idx].pre_id,", A:"+this.task[idx].start_date_auto);
        });
    }

    /**
     * idのグループを最後に移動させる
     * 
     * a=target_idのpre_id      => target_idのグループの最後のID(★)がpre_idに設定されているid(▲)のpre_id
     * c=リスト全体の最後のid    => target_idのpre_id
     * 
     * a == b or b == c and a == c ==>何もしない
     * 
     * ID PRE  AUTO        ID PRE
     *    _ID                 _ID
     * --+----+-           --+-----
     * 1  null             1  null
     * 2  1                2  1
     * 3  2a     target_id 6  2a
     * 4  3    A           7  6
     * 5★ 4   A           8  7
     * 6▲  5★             9  8
     * 7  6                3  9c target_id
     * 8  8    A           4  3    
     * 9b 8                5  4
     * 
     * @param target_id  移動対象のスケジュールID
     */
    public _moveTaskToLast(target_id:number) {
        let grp_last_id = this.getGroupEndId(target_id)
        // データの登録・更新
        let head_idx = this._getIndexById(target_id);
        let next_idx = this._getIndexByPreId(grp_last_id)
        
        this._checkMaxLatestId();
        if (head_idx != null && next_idx != null) {
            this.task[next_idx].pre_id = this.task[head_idx].pre_id;
            this.task[head_idx].pre_id = this.latest_id 
        }
        this._checkMaxLatestId();
    }

    /**
     * idのグループを最後に移動させる
     * 
     * 
     * ■before == trueの場合
     * 
     * a=worker_idのpre_id              => target_idのpre_id
     * b=target_idのグループの最後のid => worker_idのpre_id
     * 
     * b == this.latest_idでなければ何もしない
     * 
     * ID PRE  AUTO        ID PRE
     *    _ID                 _ID
     * --+----+-           --+-----
     * 1  null             1  null
     * 2  1                2  1
     * 3  2a     worker_id   8  2a target
     * 4  3    A           9  8
     * 5  4    A           3  9b worker_id
     * 6  5                4  8
     * 7  6    A           5  4
     * 8  7      target_id 6  5    
     * 9b 8    A           7  6
     * 
     * ■before == falseの場合
     * 
     * a=worker_idのグループの最後のID   => target_idのpre_id
     * b=target_idのグループの最後のid => aをpre_idにしているidのpre_id
     * 
     * b == this.latest_idでなければ何もしない
     * 
     * ID PRE  AUTO        ID PRE
     *    _ID                 _ID
     * --+----+-           --+-----
     * 1  null             1  null
     * 2  1                2  1
     * 3  2      worker_id   3  2 worker_id
     * 4  3    A           4  3
     * 5a 4    A           5  4 
     * 6  5                8  5a target
     * 7  6    A           9  8
     * 8  7      target_id 6  9b    
     * 9b 8    A           7  6
     * 
     * @param target_id  移動対象のスケジュールID
     */
    public _moveTaskLastleToDest(target_id:number,worker_id:number,before:boolean) {
        const target_last_id = this.getGroupEndId(target_id);
//        console.log(target_last_id);
        // targetが最後でなければ何もしない
        if (target_last_id != this.latest_id) {
            return;
        }
        
        if (before == true) {
            // a=worker_idのpre_id              => target_idのpre_id
            // b=target_idのグループの最後のid => worker_idのpre_id
            const t_idx = this._getIndexById(target_id);
            const d_idx = this._getIndexById(worker_id);
            if (t_idx != null && d_idx != null) {
                const a_id = this.task[d_idx].pre_id;
                const b_id = target_last_id;
                this.task[t_idx].pre_id = a_id;
                this.task[d_idx].pre_id = b_id;
            }
        } else {
            // a=worker_idのグループの最後のID   => target_idのpre_id
            // b=target_idのグループの最後のid => aをpre_idにしているidのpre_id        
            const t_idx = this._getIndexById(target_id);
            const a_id = this.getGroupEndId(worker_id);
            const b_id = target_last_id;
            const d_idx = this._getIndexByPreId(a_id);
            if (t_idx != null && d_idx != null) {
                this.task[t_idx].pre_id = a_id;
                this.task[d_idx].pre_id = b_id;
            }
        }
        this._checkMaxLatestId();
    }

    /**
     * target_idよりworker_idが前方にある場合
     * 
     * a=worker_idのpre_id        => target_idのpre_id
     * b=target_idのpre_id      => target_idがpre_idに設定されているidのpre_id
     * c=
     *   target_idがグループのheadなら: グループの最後のid
     *   target_idがグループのheadでないなら: target_id
     *                          => worker_idのpre_id
     * 
     * a == b or b == c and a == c ==>何もしない
     * 
     * ID PRE  AUTO        ID PRE
     *    _ID                 _ID
     * --+----+-           --+-----
     * 1  null             1  null
     * 2  1                2  1
     * 3  2a     worker_id   6  2a target_id
     * 4  3    A           7  6
     * 5  4    A           3  7c worker_id
     * 6  5b     target_id 4  3
     * 7c 6    A           5  4  
     * 8  7                8  5b
     * 
     * ID PRE  AUTO        ID PRE
     *    _ID                 _ID
     * --+----+-           --+-----
     * 1  null             1  null
     * 2  1                2  2
     * 3  2a     worker_id   5  2a target_id
     * 4  3    A           3  5c worker_id
     * 5c 4b     target_id 4  3
     * 6  5                6  4b
     * 
     * @param target_id  移動対象のスケジュールID
     * @param worker_id 挿入位置のスケジュールID
     */
    public _moveTaskLower(target_id:number,worker_id:number) {
        // データの登録・更新
        let t_idx:(number|null) = this._getIndexById(target_id);
        let d_idx:(number|null) = this._getIndexById(worker_id);
        let d2_idx:(number|null) = this._getIndexByPreId(target_id);

        if (t_idx != null && d_idx != null) {
            /*
            * a=worker_idのpre_id        => target_idのpre_id
            * b=target_idのpre_id      => target_idがpre_idに設定されているidのpre_id
            * c=target_id              => worker_idのpre_id
            */
            const a_id = this.task[d_idx].pre_id;
            const b_id = this.task[t_idx].pre_id;
            const c_id = this.getGroupEndId(target_id);
            if (a_id != b_id && b_id != c_id && a_id != c_id) {
                this.task[t_idx].pre_id = a_id;
                this.task[d_idx].pre_id = c_id
                if (d2_idx != null) {
                    this.task[d2_idx].pre_id = b_id;
                }
            } else {
                console.log("a="+a_id,",b="+b_id+",c="+c_id);
            }
        }
    }
    /**
     * target_idよりworker_idが後方にある場合
     * 
     * a=worker_idのpre_id        => target_idのpre_id
     * b=target_idのpre_id      => target_idがpre_idに設定されているidのpre_id
     * c=
     *   target_idがグループのheadなら: グループの最後のid
     *   target_idがグループのheadでないなら: target_id
     *                          => worker_idのpre_id
     *
     * a=worker_id           => target_idのpre_id
     * b=target_id         => worker_idがpre_idに設定されているidのpre_id
     * c=target_idのpre_id => target_idがpre_idに設定されているidのpre_id
     * 
     * ID PRE  AUTO        ID PRE
     *    _ID                 _ID
     * --+----+-           --+-----
     * 1  null             1  null
     * 2  1                2  1
     * 3  2b     target_id 6  2b
     * 4  3    A           7  6b   worker_id
     * 5a 4    A           8  7  A
     * 6d 5                3  7c   target_id
     * 7  6a     worker_id   4  3  A 
     * 8c 7    A           5  4  A
     * 9  8                9  5a

    * --+----+-           --+-----
     * 1  null           1  null
     * 2  1              2  1
     * 3b 2c target_id   4  2c worker_id 
     * 4a 3 worker_id      3  4a target_id
     * 5  4              5  3b 
     * 
     * ID PRE_ID
     * --+-------
     * 1  null          1  null
     * 2  1             2  1
     * 3b 2c target_id  4  2c
     * 4  3             5  4  worker_id
     * 5a 4  worker_id    3  5a target_id 
     * 6  5             6  3b 
     * 
     * @param target_id  移動対象のスケジュールID
     * @param worker_id 挿入位置のスケジュールID
     */
    public _moveTaskHigher(target_id:number,worker_id:number) {
        // データの登録・更新
        let t_idx:(number|null) = this._getIndexById(target_id);
        let t2_idx:(number|null) = this._getIndexByPreId(target_id);
        let d2_idx:(number|null) = this._getIndexByPreId(worker_id);

        if (t_idx != null && d2_idx != null) {
            /*
            * a=worker_idのpre_id        => target_idのpre_id
            * b=target_idのpre_id      => target_idがpre_idに設定されているidのpre_id
            * c=target_id              => worker_idのpre_id
            */
            const a_id = worker_id;
            const b_id = target_id;
            const c_id = this.task[t_idx].pre_id;
            if (a_id != b_id && b_id != c_id && a_id != c_id) {
                this.task[t_idx].pre_id = a_id;
                this.task[d2_idx].pre_id = b_id
                if (t2_idx != null) {
                    this.task[t2_idx].pre_id = c_id;
                }
            } else {
                console.log("a="+a_id,",b="+b_id+",c="+c_id);
            }
        }
    }

    /**
     * ID間の距離を取得する
     * 
     * スケジュールIDの起点と終点がどれだけ離れているかを返す。
     * 起点より終点が前（リストの先頭方向）にあればマイナスの数値を、
     * 後ろにあればプラスの数値を返す。0なら起点と終点が同じことを
     * 示す。絶対値は離れている行数を示す。
     * end_idがいつけられなかったらnullを返す
     * 
     * @param start_id    起点となるスケジュールID
     * @param end_id   終点となるスケジュールID     * 
     */
    public getDistance(start_id:number,end_id:number):number {
        let idx:number|null;
        let start_idx:number|null;
        let id:number;
        let pre_id:number|null;
        let dest:number;

        // 同じなら0を返す
        if (start_id == end_id) {
            return 0;
        }

        start_idx = this._getIndexById(start_id);
        if (start_idx == null) {
            throw new Error("can't get task by id:"+start_id);
        }
        pre_id = this.task[start_idx].pre_id;
        dest = -1;
        // start_idから先頭方向に探す
        while(pre_id != null) {
            idx = this._getIndexById(pre_id);
            if (idx == null) {
                throw new Error("can't get task by id:"+pre_id);
            }
            if (end_id == this.task[idx].id) {
                return dest;
            }
            pre_id = this.task[idx].pre_id;
            dest--;
        }
        // start_idから後方方向に探す
        idx = this._getIndexByPreId(start_id);
        dest = 1;
        while(idx != null) { 
            id = this.task[idx].id;
            if (end_id == id) {
                return dest;
            }
            idx = this._getIndexByPreId(id);
            if (idx == null) {
                throw new Error("can't get task by id:"+id);
            }
            dest++;
        }
        throw new Error("can't find end_id:"+end_id);
    }
    
    /**
     * pre_idのvaliueOptionsを生成する
     */
    public getPreIdValiueOptions() {
        let rows: number[] = [];

        for (let sc of this.task) {
            rows.push(sc.id);
        }
        return rows;
    }

    /**
     * セーブ用データを作成
     */
    public getSaveData() {
        let rows:object[] = [];
        for (let sc of this.task) {
            rows.push({
                id: sc.id,
                start_date_auto: sc.start_date_auto,
                start_date: sc.start_date,
                end_date: sc.end_date,
                duration: sc.duration,
                type: sc.type,
                name: sc.name,
                master_milestone: sc.master_milestone,
                worker_id: sc.worker_id,
                pre_id: sc.pre_id,
                level: sc.level,
                progress: sc.progress,
                ticket_no: sc.ticket_no,
                link_type: sc.link_type,
                link_id: sc.link_id
            });
        }
        return rows;
    }
}

/**
 * スケジュール
 */
export class CTask implements ITask {
    private plan: CPlan;
    
    // プロパティ
    id: number;
    start_date_auto: string;
    start_date: string;
    end_date: string;
    start_date2: Date;
    end_date2: Date;
    duration: number;
    type: string;
    name: string;
    master_milestone: number|null;
    worker_id: number|null;
    memo: string;
    pre_id: number|null;
    level: number|null;
    progress: number;
    ticket_no: string;
    link_type: string;
    link_id: null|number;
    //
    no: number;
    grp_id: number;

    constructor(plan:CPlan, data: ITask) {
        this.plan = plan;

        this.id = data.id;
        this.start_date_auto = data.start_date_auto;
        this.start_date = data.start_date;
        this.end_date = data.end_date;
        this.start_date2 = new Date(data.start_date);
        this.end_date2 = new Date(data.end_date);
        this.duration = data.duration;
        this.type = data.type;
        this.name = data.name;
        this.master_milestone = data.master_milestone;
        this.worker_id = data.worker_id;
        this.memo = data.memo;
        this.pre_id = data.pre_id;
        this.level = data.level;
        this.progress = data.progress;
        this.ticket_no = data.ticket_no;
        this.link_type = data.link_type;
        this.link_id = data.link_id;

        // 付加情報
        this.no = 0;
        this.grp_id = 0;

        this.fixDate();
    }

    public update(data:ITask) {
        this.id = data.id;
        this.start_date_auto = data.start_date_auto;
        this.start_date = data.start_date;
        this.end_date = data.end_date;
        this.start_date2 = new Date(data.start_date);
        this.end_date2 = new Date(data.end_date);
        this.duration = data.duration;
        this.type = data.type;
        this.name =data.name;
        this.master_milestone = data.master_milestone;
        this.worker_id = data.worker_id;
        this.memo = data.memo;
        this.pre_id = data.pre_id;
        this.level = data.level;
        this.progress = data.progress;
        this.ticket_no = data.ticket_no;
        this.link_type = data.link_type;
        this.link_id = data.link_id;

        this.fixDate();
    }

    /**
     * 日付の不整合の修正
     */
    private fixDate() {
        // 日付が逆転していたら開始日と同じにする
        if (this.start_date2.getTime() > this.end_date2.getTime()) {
            this.end_date2 = new Date(this.start_date2.getTime());
            this.end_date = toDateString(this.end_date2);
        }
    }

    /**
     * start_date_autoのstartend時のdurationの調整 
     */
    public setDateStartEnd(holidaies:CHolidayList) {
        if (this.start_date_auto == "startend") {
            this.duration = holidaies.getDuration(this.start_date2,this.end_date2,this.type);
        }
    }

    /**
     * start_date_autoのnormal時のend_dateの調整
     */
    public setDateNormal() {
        if (this.start_date_auto == "normal") {
            this.end_date2 = this._getDateOfDuration(new Date(this.start_date),this.duration,"add1base");
            this.end_date = toDateString(this.end_date2);
        }
    }

    /**
     * start_date_autoのpre時のstart_date/end_dateの調整
     */
    public setDatePre(pre_task:CTask) {
        if (this.start_date_auto == "pre") {
            if (pre_task.level == 99) {
                this.start_date2 = this._getDateOfDuration(pre_task.end_date2,1,"add");
                this.end_date2 =  this._getDateOfDuration(this.start_date2,this.duration,"add1base",this.type);
                this.start_date = toDateString(this.start_date2);
                this.end_date = toDateString(this.end_date2);
                this.grp_id = pre_task.grp_id;
            } else {
                this.start_date_auto = "normal";
            }
        } 
    }

    /**
     * start_date_autoのpost時のstart_date/end_dateの調整
     */
    public setDatePost(post_task:CTask) {
        if (this.start_date_auto == "post") {
            this.end_date2 = this._getDateOfDuration(post_task.start_date2,1,"sub");
            this.start_date2 = this._getDateOfDuration(this.end_date2,this.duration,"sub1base",this.type);
            this.start_date = toDateString(this.start_date2);
            this.end_date = toDateString(this.end_date2);
            this.grp_id = post_task.grp_id;
        }
    }

    /**
     * durationを加算・原産した日付を取得する
     */
    private _getDateOfDuration(date:Date,duration:number,op:string,type:string=""):Date {
        let d:number;
        if (op == "add1base" || op == "sub1base") {
            d = (duration > 0 ? duration - 1 : 0);
        } else {
            d = duration;
        }
        if (op == "add" || op == "add1base") {
            if (type == "fulltime") {
                return dayjs(date).add(d,"d").toDate();
            } else {
                return this.plan.holidaies.getNextWorkday(date,d,"forward");
            }
        } else {
            if (type == "fulltime") {
                return dayjs(date).subtract(d,"d").toDate();
            } else {
                return this.plan.holidaies.getNextWorkday(date,d,"back");
            }
        }
    }

    /**
     * Level=99以外なら、配下のtaskの範囲にstart_date/end_dateを書き換える
     * 
     * @param current_task 現在のタスク
     * @param cnt 何番目のデータが
     */
    public updateTopDate(current_task:CTask,cnt:number) {
        if (cnt == 0) { // 最初のデータなら
            this.start_date = current_task.start_date;
            this.end_date = current_task.end_date;
            this.start_date2 = new Date(this.start_date);
            this.end_date2 = new Date(this.end_date);
            this.start_date_auto = "startend";
            this.duration = 1;
        } else {
            if (this.start_date2 > current_task.start_date2) {
                this.start_date = current_task.start_date;
                this.start_date2 = new Date(this.start_date);
            }
            if (this.start_date2 < current_task.start_date2) {
                this.end_date = current_task.end_date;
                this.end_date2 = new Date(this.end_date);                            
            }
        }
    }
}
