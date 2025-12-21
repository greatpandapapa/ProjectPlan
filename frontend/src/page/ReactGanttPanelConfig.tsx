import {} from "@svar-ui/react-gantt"; 

export const dayStyle = (a:Date) => {
    const day = a.getDay() === 0 || a.getDay() === 6;
    return day ? "wx-weekend" : "";
};

const scales = [
    { unit: "month", step: 1, format: "yyyy/M" },
    { unit: "day", step: 1, format: "d",css: dayStyle },
];

export function getScales(level:string):any[] {
    if (level == "month") {
        return [200,[scales[0]]];
    } else {
        return [20,scales];
    }
}

export const ja = {
    //calendar
    calendar: {
        monthFull: [
            "1月",
            "2月",
            "3月",
            "4月",
            "5月",
            "6月",
            "7月",
            "8月",
            "9月",
            "10月",
            "11月",
            "12月",
        ],
        monthShort: [
            "1月",
            "2月",
            "3月",
            "4月",
            "5月",
            "6月",
            "7月",
            "8月",
            "9月",
            "10月",
            "11月",
            "12月",
        ],
        
        dayFull: [
            "日曜日",
            "月曜日",
            "火曜日",
            "水曜日",
            "木曜日",
            "金曜日",
            "土曜日",
        ],

        dayShort: ["日", "月", "火", "水", "木", "金", "土"],
        hours: "時",
        minutes: "分",
        done: "Done",
        clear: "Clear",
        today: "Today",
        am: ["am", "AM"],
        pm: ["pm", "PM"],
        
        weekStart: 7,
        clockFormat: 24
    },

    //core
    core: {
        ok:"OK",
        cancel:"Cancel",
        select: "Select",
        "No data": "No data"
    },

    //formats
    formats: {
        dateFormat: "%Y-%m-%d",
        timeFormat: "%H:%i"
    },

    lang: "ja-JP",

    //Gantt
    gantt: {
        // Header / sidebar
        "Task name": "タスク名",
        "Start date": "開始日",
        Duration: "日数",
        Task: "タスク",
        Milestone: "マイルストン",
        "Summary task": "サマリタスク",

        // Sidebar
        Save: "保存",
        Delete: "削除",
        Name: "タスク名",
        Description: "日数",
        "Select type": "Select type",
        Type: "タイプ",
        "End date": "終了日",
        Progress: "進捗",
        Predecessors: "Predecessors",
        Successors: "Successors",
        "Add task name": "Add task name",
        "Add description": "Add description",
        "Select link type": "Select link type",
        "End-to-start": "End-to-start",
        "Start-to-start": "Start-to-start",
        "End-to-end": "End-to-end",
        "Start-to-end": "Start-to-end",

        // Context menu / toolbar
        Add: "追加",
        "Child task": "子タスク",
        "Task above": "前タスク",
        "Task below": "後タスク",
        "Convert to": "変更",
        Edit: "編集",
        Cut: "カット",
        Copy: "コピー",
        Paste: "ペースト",
        Move: "移動",
        Up: "Up",
        Down: "Down",
        Indent: "インデント",
        Outdent: "アウトデント",
        "Split task": "タスク分割",

        // Toolbar
        "New task": "タスク追加",
        "Move up": "Up",
        "Move down": "Down",
    },
};

