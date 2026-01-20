import { format } from "date-fns";

// Date型の日付をyyyy-MM-dd形式で文字列にする
export function toDateString(date:Date):string {
    return format(date,"yyyy-MM-dd");
}
// Date型の日付をyyyy-MM-dd hh:mm形式で文字列にする
export function toDateTimeString(date:Date):string {
    return format(date,"yyyy-MM-dd HH:mm");
}
// 今日の日付のyyyy-MM-dd形式の文字列を取得
export function getTodayDateString():string {
    return toDateString(new Date());
}
// 今日の日付のyyyy-MM-dd hh:mm形式の文字列を取得
export function getTodayDateTimeString():string {
    return toDateTimeString(new Date());
}

// Date型のデータがInvalid Dateか確認する
export function isInvalidDate(date:Date):boolean {
    return Number.isNaN(date.getTime());
}