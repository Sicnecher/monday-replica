import { boardService } from "../../services/board.service";
import { showSuccessMsg } from "../../services/event-bus.service";
import { utilService } from "../../services/util.service";
import { store } from "../store";

import { EDIT_BOARD, REMOVE_BOARD, SET_BOARDS, OPEN_MODAL } from '../reducer/boards.reducer'

export async function addBoard() {
  try {
    const savedBoard = await boardService.addBoard();

    const boards = await boardService.query();

    await store.dispatch({
      type: SET_BOARDS,
      boards,
    });

    showSuccessMsg("Board added successfully");

    return savedBoard;
  } catch (error) {
    console.error("Error adding board:", error);
    throw error;
  }
}

export async function loadBoards() {
  const boards = await boardService.query();
  await store.dispatch({ type: SET_BOARDS, boards });
  showSuccessMsg("Boards loaded");
}

export async function addGroup(boardId) {
  const newGroup = {
    id: utilService.makeId(),
    title: "New Group",
    color: utilService.getRandomColor(),
    tasks: [],
  };

  await boardService.addGroupToBoard(boardId, newGroup);

  const board = await boardService.getById(boardId);
  if (!board) return;

  await store.dispatch({
    type: EDIT_BOARD,
    boardId,
    updatedBoard: board,
  });

  showSuccessMsg("Group added successfully");
}

export async function addItem(boardId, groupId, itemTitle) {
  const today = new Date();
  const formattedDate = utilService.formatDateToStr(today);

  const newItem = {
    id: utilService.makeId(),
    taskTitle: itemTitle,
    members: [],
    date: formattedDate, // Updated to show the formatted date
    status: { text: "", color: "#C4C4C4" },
    priority: { text: "", color: "#C4C4C4" },
    chat: [],
  };
  await boardService.addItemToGroup(boardId, groupId, newItem);

  const board = await boardService.getById(boardId);
  if (!board) return;

  const updatedBoard = {
    ...board,
    groups: board.groups.map((group) =>
      group.id === groupId ? { ...group, tasks: [...group.tasks] } : group
    ),
  };

  await store.dispatch({
    type: EDIT_BOARD,
    boardId,
    updatedBoard,
  });

  showSuccessMsg("Item added successfully");
}

export async function removeGroup(boardId, groupId) {
  await boardService.removeGroupFromBoard(boardId, groupId);

  const board = await boardService.getById(boardId);
  if (!board) throw new Error("Board not found");

  const updatedBoard = {
    ...board,
    groups: board.groups.filter((group) => group.id !== groupId),
  };

  await store.dispatch({
    type: EDIT_BOARD,
    boardId,
    updatedBoard,
  });

  showSuccessMsg("Group removed successfully");
}

export async function updateGroup(boardId, groupId, updatedGroupData) {
  // Update the group in the board service
  await boardService.updateGroupInBoard(boardId, groupId, updatedGroupData);
  await boardService.updateGroupInBoard(boardId, groupId, updatedGroupData)

  const board = await boardService.getById(boardId);
  if (!board) throw new Error("Board not found");

  const updatedBoard = {
    ...board,
    groups: board.groups.map((group) =>
      group.id === groupId ? { ...group, ...updatedGroupData } : group
    ),
  };

  await store.dispatch({
    type: EDIT_BOARD,
    boardId,
    updatedBoard,
  });

  showSuccessMsg("Group updated successfully");
}

export async function removeTasks(boardId, tasksArr) {
  const board = await boardService.removeTasksFromGroup(boardId, tasksArr);
  if (!board) return;

  const updatedBoard = {
    ...board,
    groups: board.groups.map((group) =>
      tasksArr.some((scdArr) => scdArr[0] === group.id)
        ? {
            ...group,
            tasks: group.tasks.filter(
              (task) => !tasksArr.some((scdArr) => scdArr[1] === task.id)
            ),
          }
        : group
    ),
  };

  await store.dispatch({
    type: EDIT_BOARD,
    boardId,
    updatedBoard,
  });
}

export async function removeBoard(boardId) {
  try {
    await boardService.remove(boardId)
    store.dispatch({ type: REMOVE_BOARD, boardId })
  } catch (err) {
    console.error('Failed to remove board:', err)
  }
}

export async function updateTask(boardId, info) {
  await boardService.updateTaskInGroup(boardId, info);

  const board = await boardService.getById(boardId)
  if (!board) return

  const updatedBoard = {
    ...board,
    groups: board.groups.map((group) =>
      group.id === info.group.id
        ? {
            ...group,
            tasks: group.tasks.map((task) =>
              task.id === info.task.id ? { ...task, ...info.value } : task
            ),
          }
        : group
    ),
  };

  console.log(updatedBoard);

  await store.dispatch({
    type: EDIT_BOARD,
    boardId,
    updatedBoard,
  });

  showSuccessMsg("Task updated successfully");
}

export async function updateBoardName(boardId, newName) {
  try {
    const updatedBoard = await boardService.updateBoardName(boardId, newName)

    store.dispatch({ type: EDIT_BOARD, boardId, updatedBoard })
  } catch (error) {
    console.error('error dispatching board name update:', error)
  }
}

export async function openModal(taskId){
  store.dispatch({ type: OPEN_MODAL, taskId })
}
