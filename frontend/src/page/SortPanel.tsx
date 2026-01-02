import {useState} from 'react';
import { plan } from '../lib/Plan';
import {ITaskTable,ITaskNestedTable} from '../lib/typings';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import { SlimTableCell } from '../component/CustomMui';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {useWindowSize} from '../component/useWindowsSize';
import { Typography } from '@mui/material';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
  restrictToParentElement
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {getBgColor} from '../component/CustomMui';
import DragHandleIcon from "@mui/icons-material/DragHandle"
import {
  DraggableAttributes,
  DraggableSyntheticListeners
} from "@dnd-kit/core";

/**
 * スケジュール編集パネル
 */
function SortPanel() {
  const [width, height] = useWindowSize();
  let initialRows = plan.getNestedTableRows(); 
  const [rows, setRows] = useState(initialRows);

  //https://zenn.dev/koharu2739/articles/31c240c5ee5278
  // ドラッグ可能なセンサーを設定
  const sensors = useSensors(useSensor(PointerSensor),useSensor(TouchSensor));
  // ドラッグ終了時の処理
  const handleDragEnd = ((event: DragEndEvent) => {
    const { active, over } = event;
      if (over) {
//        console.log("active_id:"+active.id+",over_id:"+over.id);
        const target_id:number = Number(active.id);
        const dest_id:number = Number(over.id);
 //       console.log("target_id:"+target_id+",dest_id:"+dest_id);
        plan.moveTask(target_id,dest_id);
        const initialRows = plan.getNestedTableRows(); 
        setRows(initialRows);      
      }
    }
);

  /**
   * ソート機能付きスケジュールテーブル
   * 
   * @returns 
   */
  const SortableTaskTable = ()=>(
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[
        restrictToVerticalAxis,
        restrictToWindowEdges,
        restrictToParentElement
      ]}
    >
      <SortableContext
        items={rows.map((row) => row.id)}
        strategy={verticalListSortingStrategy}
      >
        {TaskTable()}
      </SortableContext>
    </DndContext>
  );

  /**
   * スケジュールテーブル
   * 
   * SortableContextを二重化している。
   * グループごとと、グループ内の二重
   */
  const TaskTable = () => (
    <TableContainer sx={{ maxHeight: height-140 }}>
      <Table sx={{ minWidth: 650,padding: '1px 1px' }} stickyHeader aria-label="sticky table">
        <TableHead>
          <TableRow>
            <SlimTableCell component="th"></SlimTableCell>
            <SlimTableCell align="center" component="th">ID</SlimTableCell>
            <SlimTableCell align="center" component="th">開始</SlimTableCell>
            <SlimTableCell align="center" component="th">終了</SlimTableCell>
            <SlimTableCell align="center" component="th">日数</SlimTableCell>
            <SlimTableCell component="th">Level</SlimTableCell>
            <SlimTableCell component="th">作業名</SlimTableCell>
            <SlimTableCell component="th">作業者</SlimTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
            <SortableContext items={rows.map((grp_rows)=>grp_rows.head_id)}>
            {rows.map((grp_rows) => (
                <DraggableTaskTableRow key={grp_rows.head_id} grp_rows={grp_rows}/>
            ))}
            </SortableContext>
        </TableBody>
      </Table>
    </TableContainer>
  );

  type TaskTableRowProps = {
    grp_rows:ITaskNestedTable
  };

  /**
   * スケジュールテーブルの行（グループ）
   * 
   * 上位のIDと、下位のSortableContextのIDが重複しないようにTaskのIDをIDにしている
   */
  const DraggableTaskTableRow = ((props:TaskTableRowProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: props.grp_rows.head_id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition
    };
    const style2 = {...style,backgroundColor:props.grp_rows.id % 2 === 0 ? getBgColor('even') : getBgColor('odd')};

    // 先頭の１行
    const top_row = props.grp_rows.rows[0];
    const other_rows = props.grp_rows.rows.slice(1, props.grp_rows.rows.length);
    if (top_row === undefined) {
      throw new Error("DraggableTaskTableRow: rows is branck array.");
    }

    return (
      <>
        <TableRow key={top_row.id} ref={setNodeRef} style={style2} {...attributes} >
            <TaskSlimTableCells listeners={listeners} row={top_row}  grp_head={true} grp_count={props.grp_rows.count}/>
        </TableRow>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[
            restrictToVerticalAxis,
            restrictToWindowEdges,
            restrictToParentElement
          ]}
        >
          <SortableContext items={other_rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
            {other_rows.map((row) => (
              <DraggableTaskTableRowOther grp_id={props.grp_rows.id} row={row}/>
            ))}
          </SortableContext>
        </DndContext>
      </>
    );
  });

  interface TaskTableRowOtherProps {
    grp_id: number;
    row:ITaskTable;
  };

  /**
   * 各グループの先頭以外の行
   * 
   * 各グループのSortableContextを配置し、グループ内のソートを実現
   */
  const DraggableTaskTableRowOther = ((props:TaskTableRowOtherProps) => {
    const local_key = props.row.id
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: local_key });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition
    };
    const style2 = {...style,backgroundColor:props.grp_id % 2 === 0 ? getBgColor('even') : getBgColor('odd')};

    return (
        <TableRow key={props.row.id} ref={setNodeRef} style={style2} {...attributes} {...listeners}>
            <TaskSlimTableCells listeners={listeners} row={props.row} grp_head={false} grp_count={1} />
        </TableRow>
    );
  });

  interface  TaskSlimTableCellsProps {
    row:ITaskTable;
    listeners:DraggableSyntheticListeners;
    grp_head: boolean;
    grp_count: number;
  };

  /**
   * １行の全セルを出力
   */
  const TaskSlimTableCells = ((props:TaskSlimTableCellsProps) => {
    return (
      <>
        {props.grp_head == true ? (
         <SlimTableCell rowSpan={props.grp_count} style={{verticalAlign:'top'}}>
            <DragHandleIcon {...props.listeners}/>
          </SlimTableCell>
         ):<></>}
        <SlimTableCell align="center">{props.row.id}</SlimTableCell>
        <SlimTableCell align="center">{props.row.start_date}</SlimTableCell>
        <SlimTableCell align="center">{props.row.end_date}</SlimTableCell>
        <SlimTableCell align="center">{props.row.duration}</SlimTableCell>
        <SlimTableCell align="left">{props.row.level_label}</SlimTableCell>
        <SlimTableCell align="left">{props.row.name}</SlimTableCell>
        <SlimTableCell align="left">{props.row.worker.name}</SlimTableCell>
      </>
    );
  });

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', marginY: "0px" }}>
       {SortableTaskTable()}
    </Paper>
  );
}

export default SortPanel;