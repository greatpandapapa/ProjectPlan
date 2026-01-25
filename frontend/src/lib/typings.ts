export interface IPlan {
    title: string;
    name: string;
    rev: number;
    purpose: string;
    create_date: string;
    update_date: string;
    status: string;
    masterplan: null|string;
    ticket_url: string;
}
export interface IBaseListItem {
    id: number;
}
export interface IReference extends IBaseListItem {
    id: number;
    site: string;
    url: string;  
    memo: string;
}
export interface ITask extends IBaseListItem {
    id: number;
    start_date_auto: string;
    start_date: string;
    end_date: string;
    duration: number;
    type: string;
    name: string;
    master_milestone: number|null;
    worker_id: number|null;
    memo: string;
    pre_id: number|null;
    level: number|null;
    progress:number;
    ticket_no: string;
    link_type: string;
    link_id: null|number;
    open?: boolean;
}
export interface IWorker extends IBaseListItem {
    id: number;
    type: string;
    name: string;
    color: string;
}
export interface IHoliday extends IBaseListItem {
    id: number;
    date: Date;
}
export interface IUpdateTask  {
    id: number;
    start_date?: string;
    duration?: number;
    name?: string;
    progress?: number;
}

export interface DataJson {
    plan: IPlan,
    reference: IReference[],
    task: ITask[],
    worker: IWorker[],
    holiday: IHoliday[]
}

/*
declare module '*.json' {
    const data: DataJson
    export default data;
}
*/

export interface ITaskRows extends ITask {
    no: number;
    start_date2: Date;
    end_date2: Date;
    order_grp_id: number;
    level0_grp_id: number;
    level1_grp_id: number;
    level2_grp_id: number;
}

export interface ITaskTable  extends ITaskRows {
    level_label: string,
    type_label: string,
    start_date_auto_label: string,
    worker: IWorker,
    master_milestone_label: string,
    ticket_link: null|URL
}

export interface ITaskNestedTable {
    id: number;
    count: number;
    head_id: number;
    rows:ITaskTable[];
}

export interface IValueOptions {
    label: string,
    value: string|number,
}
 
export interface IActionItem extends IBaseListItem {
    id: number;
    name: string;
    type: string;
    limit_date: Date|null;
    memo: string;
    done: boolean;
} 