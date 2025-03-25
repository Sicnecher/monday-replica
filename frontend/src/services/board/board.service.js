import { httpService } from "../http.service";
import { utilService } from "../util.service.js";

export const boardService = {
  query,
  getById,
  remove,
  save,
  addGroupToBoard,
  makeFirstBoard,
  addItemToGroup,
  removeGroupFromBoard,
  removeTaskFromGroup,
  removeTasksFromGroup,
  updateTaskInGroup,
  updateGroupInBoard,
  addBoard,
  updateBoardName,
  updateBoard,
  saveTempChatInfo,
  getChatTempInfo,
  getDefaultFilter,
  openChat,
  getOpenChat,
  replaceChats,
  getFilterState,
  setFilterStateSession,
  getFilterContextSession,
  setFilterContextSession,
  addLableToBoard,
  getDefultCell,
  setFilteredColumnsSession,
  getFilteredColumnsSession,
  removeBoardFromFilteredColumnsSession,
  deleteLableFromBoard,
  changeLabelName,
  changeLabelWidth,
  addMultipleItemsToGroup,
  updateBoardFavorite,
  getGroupsColors,
};

const CHAT_KEY = "chat";

// BASIC FUNCTIONS *************

// mabye to fix not calling backend twice
async function query() {
  try {
    let boards = await httpService.get(`board`);
    if (boards)
      return boards;
  } catch (error) {
    console.log("Error:", error);
    throw error;
  }
}

async function getById(boardId) {
  return await httpService.get(`board/${boardId}`);
}

async function remove(boardId) {
  return await httpService.delete(`board/${boardId}`);
}

async function save(board) {
  if (board._id) {
    return await httpService.put(`board/${board._id}`, board);
  } else {
    return await httpService.post("board", board);
  }
}

// FROM HERE ON THERE IS NOT SUPPOSE TO BE DIFFRENCE BETWEEN LOCAL AND REMOTE SERVICES

// change so each board has isFavorite prop instead whatever this bs

// async function setFavorites(favoriteId) {
//   const localFavorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []
//   if (localFavorites && localFavorites[0]) {
//     const index = await localFavorites.findIndex((id) => id === favoriteId)
//     if (index !== -1) {
//       localFavorites.splice(index, 1)
//     } else if (typeof favoriteId === 'string') {
//       localFavorites.push(favoriteId)
//     }
//     localStorage.setItem(FAVORITES_KEY, JSON.stringify(localFavorites))
//     return await localFavorites
//   } else {
//     const inputFavorite = Array.isArray(favoriteId) ? favoriteId : [favoriteId]
//     localStorage.setItem(FAVORITES_KEY, JSON.stringify(inputFavorite))
//     return inputFavorite
//   }
// }

async function addBoard(boardName) {
  try {
    const newBoard = {
      title: boardName,
      isFavorite: false,
      labels: [
        {
          id: utilService.makeIdForLabel(),
          type: "taskTitle",
          name: "Task",
          width: 400,
        },
        {
          id: utilService.makeIdForLabel(),
          type: "priority",
          name: "Priority",
          width: 150,
        },
        {
          id: utilService.makeIdForLabel(),
          type: "status",
          name: "Status",
          width: 150,
        },
        {
          id: utilService.makeIdForLabel(),
          type: "members",
          name: "People",
          width: 150,
        },
        {
          id: utilService.makeIdForLabel(),
          type: "date",
          name: "Date",
          width: 150,
        },
      ],
      groups: [],
    };
    const savedBoard = save(newBoard);

    return savedBoard;
  } catch (error) {
    console.error("Error adding board:", error);
    throw error;
  }
}

async function addGroupToBoard(boardId, newGroup) {
  const board = await getById(boardId);
  if (!board) throw new Error("Board not found");

  newGroup.id = `group${Date.now()}`;
  const updatedGroups = [...(board.groups || []), { ...newGroup }];

  const updatedBoard = {
    ...board,
    groups: updatedGroups,
  };

  await save(updatedBoard);
  return newGroup;
}

async function addItemToGroup(
  boardId,
  groupId,
  newItem,
  isStart = null,
  idx = null
) {
  const taskGroupId = newItem.cells[0].value.activities[0].activity.groupId;
  if (taskGroupId !== groupId) {
    newItem.cells[0].value.activities = newItem.cells[0].value.activities.map(
      (e) => ({
        ...e,
        activity: {
          ...e.activity,
          groupId: groupId,
        },
      })
    );
  }

  const board = await getById(boardId);
  if (!board) throw new Error("Board not found");

  const groupIndex = board.groups.findIndex((group) => group.id === groupId);
  if (groupIndex === -1) throw new Error("Group not found");

  idx
    ? board.groups[groupIndex].tasks.splice(idx, 0, newItem)
    : isStart
    ? board.groups[groupIndex].tasks.unshift(newItem)
    : board.groups[groupIndex].tasks.push(newItem);
  await save(board);
}

async function addMultipleItemsToGroup(boardId, tasksToAdd) {
  const board = await getById(boardId);
  if (!board) throw new Error("Board not found");

  tasksToAdd.forEach((task) => {
    const group = board.groups.find((group) => group.id === task[0]);
    if (!group) throw new Error("Group not found");

    const taskToDuplicateIdx = group.tasks.findIndex((t) => t.id === task[1]);
    if (!group.tasks[taskToDuplicateIdx]) throw new Error("Task not found");

    const newTaskId = utilService.makeId();

    const newItem = {
      ...group.tasks[taskToDuplicateIdx],
      id: newTaskId,
      cells: group.tasks[taskToDuplicateIdx].cells.map((cell, idx) =>
        idx === 0
          ? {
              ...cell,
              taskId: newTaskId,
              value: {
                title: `${cell.value.title} (copy)`,
                chat: [],
                activities: [
                  {
                    time: Date.now(),
                    taskId: newTaskId,
                    userId: cell.value.activities[0].userId,
                    activity: {
                      groupId: group.id,
                      field: "taskTitle",
                      type: "Duplicated",
                    },
                  },
                ],
              },
            }
          : {
              ...cell,
              taskId: newTaskId,
            }
      ),
    };

    group.tasks.splice(taskToDuplicateIdx + 1, 0, newItem);
  });

  return await save(board);
}

async function removeGroupFromBoard(boardId, groupId) {
  const board = await getById(boardId);
  if (!board) throw new Error("Board not found");

  board.groups = board.groups.filter((group) => group.id !== groupId);
  await save(board);
}

async function removeTasksFromGroup(boardId, tasksToRemove) {
  try {
    const board = await getById(boardId);
    if (!board) throw new Error("Board not found");

    tasksToRemove.forEach((task) => {
      const group = board.groups.find((group) => group.id === task[0]);
      if (!group) throw new Error("Group not found");

      group.tasks = group.tasks.filter((t) => t.id !== task[1]);
    });

    return await save(board);
  } catch (error) {
    console.error("Error removing tasks:", error);
    throw error;
  }
}

function getDefaultFilter() {
  return {
    tasTitle: "",
    priority: "",
    status: "",
    members: "",
  };
}

async function removeTaskFromGroup(boardId, groupId, taskId) {
  const board = await getById(boardId);
  if (!board) throw new Error("Board not found");

  const groupIndex = board.groups.findIndex((group) => group.id === groupId);
  if (groupIndex === -1) throw new Error("Group not found");

  const group = board.groups[groupIndex];
  const taskIndex = group.tasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) throw new Error("Task not found");

  group.tasks.splice(taskIndex, 1); // Remove the task

  // Save the updated board with the modified group
  await save(board);
  return board; // Returning the updated group (optional, for use in UI or elsewhere)
}
// cell: {taskId:xxx, labelId: xxx, value: xxx, type: xxx}
async function updateTaskInGroup(boardId, userId, newCell) {
  try {
    const board = await getById(boardId); // Call directly without 'this'
    const groupIndex = board.groups.findIndex((group) =>
      group.tasks.some((task) => task.id === newCell.taskId)
    );
    const taskIndex = board.groups[groupIndex].tasks.findIndex(
      (task) => task.id === newCell.taskId
    );
    const cellIndex = board.groups[groupIndex].tasks[taskIndex].cells.findIndex(
      (cell) => cell.labelId === newCell.labelId
    );
    const newActivity = {
      time: Date.now(),
      userId,
      taskId: newCell.taskId,
      activity:
        newCell.type === "members"
          ? {
              groupId: board.groups[groupIndex].id,
              field: "members",
              type:
                board.groups[groupIndex].tasks[taskIndex].cells[cellIndex].value
                  .length > newCell.value.length
                  ? "Removed"
                  : "Added",
              item:
                board.groups[groupIndex].tasks[taskIndex].cells[cellIndex].value
                  .length > newCell.value.length
                  ? board.groups[groupIndex].tasks[taskIndex].cells[
                      cellIndex
                    ].value.filter((member) => !newCell.value.includes(member))
                  : newCell.value.filter(
                      (member) =>
                        !board.groups[groupIndex].tasks[taskIndex].cells[
                          cellIndex
                        ].value.includes(member)
                    ),
            }
          : {
              groupId: board.groups[groupIndex].id,
              field: newCell.type,
              type: "Changed",
              preChange:
                newCell.type === "taskTitle"
                  ? {
                      title:
                        board.groups[groupIndex].tasks[taskIndex].cells[
                          cellIndex
                        ].value.title,
                    }
                  : board.groups[groupIndex].tasks[taskIndex].cells[cellIndex]
                      .value,
              postChange:
                newCell.type === "taskTitle"
                  ? { title: newCell.value.title }
                  : newCell.value,
            },
    };

    const updatedBoard = {
      ...board,
      groups: board.groups.map((group) => ({
        ...group,
        tasks: group.tasks.map((task) => ({
          ...task,
          cells: task.cells.map((cell) =>
            cell.taskId === newCell.taskId && cell.type === "taskTitle"
              ? cell.labelId === newCell.labelId
                ? {
                    ...cell,
                    value: {
                      ...newCell.value,
                      activities: [...cell.value.activities, newActivity],
                    },
                  }
                : {
                    ...cell,
                    value: {
                      ...cell.value,
                      activities: [...cell.value.activities, newActivity],
                    },
                  }
              : cell.taskId === newCell.taskId &&
                cell.labelId === newCell.labelId
              ? newCell
              : cell
          ),
        })),
      })),
    };
    await save(updatedBoard);

    return newCell.value;
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
}

const statusArray = [
  { text: "Done", color: "#00C875" },
  { text: "Working on it", color: "#FDAB3D" },
  { text: "Stuck", color: "#DF2F4A" },
  { text: "Blank", color: "#C4C4C4" },
];

async function updateGroupInBoard(boardId, groupId, updatedGroupData) {
  try {
    const board = await getById(boardId);
    if (!board) throw new Error("Board not found");

    const groupIndex = board.groups.findIndex((group) => group.id === groupId);
    if (groupIndex === -1) throw new Error("Group not found");

    board.groups[groupIndex] = {
      ...board.groups[groupIndex],
      ...updatedGroupData,
    };
    await save(board);

    return board.groups[groupIndex];
  } catch (error) {
    console.error("Error updating group:", error);
    throw error;
  }
}

async function updateBoard(boardId, updatedBoardData) {
  try {
    const board = await getById(boardId);
    if (!board) throw new Error("Board not found");

    const updatedBoard = {
      ...board,
      ...updatedBoardData,
    };

    await save(updatedBoard);

    return updatedBoard;
  } catch (error) {
    console.error("Error updating board:", error);
    throw error;
  }
}

async function updateBoardName(boardId, newName) {
  try {
    // Retrieve the board by ID
    const board = await getById(boardId);
    if (!board) throw new Error(`Board with ID ${boardId} not found`);

    // Update the board's name
    board.title = newName;

    // Save the updated board back to storage
    const updatedBoard = await save(board);
    return updatedBoard;
  } catch (error) {
    console.error("Error updating board name:", error);
    throw error;
  }
}

async function updateBoardFavorite(boardId) {
  try {
    const board = await getById(boardId);
    if (!board) throw new Error(`Board with ID ${boardId} not found`);

    // Update the board's name
    board.isFavorite = !board.isFavorite;

    // Save the updated board back to storage
    const updatedBoard = await save(board);
    return updatedBoard;
  } catch (error) {
    console.error("Error updating board name:", error);
    throw error;
  }
}

async function makeFirstBoard() {

  const board = {
    title: "SAR default board",
    labels: [
      {
        id: utilService.makeIdForLabel(),
        type: "taskTitle",
        name: "Task",
        width: 400,
      },
      {
        id: utilService.makeIdForLabel(),
        type: "priority",
        name: "Priority",
        width: 150,
      },
      {
        id: utilService.makeIdForLabel(),
        type: "status",
        name: "Status",
        width: 150,
      },
      {
        id: utilService.makeIdForLabel(),
        type: "members",
        name: "Members",
        width: 150,
      },
      {
        id: utilService.makeIdForLabel(),
        type: "date",
        name: "Date",
        width: 150,
      },
    ],
    groups: [],
  };

  const savedBoard = await save(board);
  setFilteredColumnsSession([
    { id: savedBoard._id, labels: savedBoard.labels },
  ]);
}

// newComments = [width: xxx, scroll: xxx, open: xxx, comments: [{id: xxx, comment: xxx}, ...]]
function saveTempChatInfo(id, width, scroll, newComment) {
  const newCommentsStr = sessionStorage.getItem(CHAT_KEY);

  // in case no newComments exists
  if (!newCommentsStr)
    return sessionStorage.setItem(
      CHAT_KEY,
      JSON.stringify({
        width,
        scroll,
        open: id,
        comments: [{ id, comment: newComment }],
      })
    );

  const newComments = JSON.parse(newCommentsStr);
  newComments.width = width;
  newComments.scroll = scroll;
  const commentIndex = newComments.comments.findIndex(
    (comment) => comment.id === id
  );

  // if comment already in commends array
  if (commentIndex !== -1)
    newComments.comments[commentIndex].comment = newComment;
  // if not
  else newComments.comments.push({ id, comment: newComment });

  sessionStorage.setItem(CHAT_KEY, JSON.stringify(newComments));
}

function getChatTempInfo(id) {
  const newCommentsStr = sessionStorage.getItem(CHAT_KEY);
  // in case no newComments exists
  if (!newCommentsStr) return null;
  else {
    const newComments = JSON.parse(newCommentsStr);
    const commentIndex = newComments.comments.findIndex(
      (comment) => comment.id === id
    );

    // in case comment exists
    if (commentIndex !== -1)
      return {
        id,
        width: newComments.width,
        scroll: newComments.scroll,
        comment: newComments.comments[commentIndex].comment,
      };
    // in case it's not
    else return null;
  }
}

function openChat(id) {
  const newCommentsStr = sessionStorage.getItem(CHAT_KEY);
  if (newCommentsStr) {
    const newComments = JSON.parse(newCommentsStr);
    newComments.open = id;
    sessionStorage.setItem(CHAT_KEY, JSON.stringify(newComments));
  }
}

function getOpenChat() {
  const newCommentsStr = sessionStorage.getItem(CHAT_KEY);
  if (newCommentsStr) {
    const newComments = JSON.parse(newCommentsStr);
    return newComments.open;
  } else return null;
}

function replaceChats(newModals, modalId) {
  if (modalId.substring(0, 4) === "chat") {
    let result = newModals.filter((id) => id.substring(0, 4) !== "chat");
    return [...result, modalId];
  }
  return newModals;
}

function setFilterStateSession(state) {
  sessionStorage.setItem("filterState", state);
}

function setFilterContextSession(txt) {
  sessionStorage.setItem("filterContext", txt);
}

function setFilteredColumnsSession(newColumn) {
  const filteredColumnsArr = JSON.parse(
    sessionStorage.getItem("filteredColumns")
  );
  if (filteredColumnsArr && filteredColumnsArr[0]) {
    const index = filteredColumnsArr.findIndex(
      (column) => column.id === newColumn.id
    );
    index < 0
      ? filteredColumnsArr.push(newColumn)
      : newColumn.newLabel
      ? filteredColumnsArr[index].labels.push(newColumn.newLabel)
      : filteredColumnsArr[index].labels = (newColumn.labels)
    sessionStorage.setItem(
      "filteredColumns",
      JSON.stringify(
        Array.isArray(filteredColumnsArr)
          ? filteredColumnsArr
          : [filteredColumnsArr]
      )
    );
    return filteredColumnsArr;
  } else {
    sessionStorage.setItem(
      "filteredColumns",
      JSON.stringify(Array.isArray(newColumn) ? newColumn : [newColumn])
    );
  }
}

function getFilteredColumnsSession() {
  const filteredColumns = sessionStorage.getItem("filteredColumns");
  return filteredColumns;
}

function removeBoardFromFilteredColumnsSession(boardId) {
  const filteredColumns = sessionStorage.getItem("filteredColumns");
  if (filteredColumns) {
    const filteredColumnsArr = JSON.parse(filteredColumns);
    const newFilteredColumns = filteredColumnsArr.filter(
      (column) => column.id !== boardId
    );
    sessionStorage.setItem(
      "filteredColumns",
      JSON.stringify(newFilteredColumns)
    );
    return newFilteredColumns;
  }
}

function getFilterContextSession() {
  const filterContext = sessionStorage.getItem("filterContext");
  if (filterContext) {
    return filterContext;
  } else {
    setFilterContextSession(false);
    return "";
  }
}

function getFilterState() {
  const filterState = sessionStorage.getItem("filterState");
  if (filterState) {
    const state = JSON.parse(filterState);
    return state;
  } else {
    setFilterStateSession(false);
    return false;
  }
}

async function addLableToBoard(boardId, newLable) {
  const board = await getById(boardId);
  if (board) {
    board.labels.push(newLable);
    const newGroups = board.groups.map((group) => ({
      ...group,
      tasks: group.tasks.map((task) => ({
        ...task,
        cells: [...task.cells, getDefultCell(newLable, task.id)],
      })),
    }));
    board.groups = newGroups;
    save(board);
    return board;
  } else throw new Error("Board not found");
}

async function deleteLableFromBoard(boardId, labelId) {
  const board = await getById(boardId);
  if (board) {
    board.labels = board.labels.filter((label) => label.id !== labelId);
    const newGroups = board.groups.map((group) => ({
      ...group,
      tasks: group.tasks.map((task) => ({
        ...task,
        cells: task.cells.filter((cell) => cell.labelId !== labelId),
      })),
    }));
    board.groups = newGroups;
    save(board);
    return board;
  } else throw new Error("Board not found");
}

async function changeLabelName(boardId, labelId, newName) {
  const board = await getById(boardId);
  if (board) {
    board.labels = board.labels.map((label) =>
      label.id === labelId ? { ...label, name: newName } : label
    );
    save(board);
    return board;
  } else throw new Error("Board not found");
}

async function changeLabelWidth(boardId, labelId, newWidth) {
  const board = await getById(boardId);
  if (board) {
    board.labels = board.labels.map((label) =>
      label.id === labelId ? { ...label, width: newWidth } : label
    );
    save(board);
    return board;
  } else throw new Error("Board not found");
}

function getDefultCell(label, taskId) {
  switch (label.type) {
    case "priority":
      return {
        taskId,
        labelId: label.id,
        value: { text: "", color: "#C4C4C4" },
        type: label.type,
      };

    case "status":
      return {
        taskId,
        labelId: label.id,
        value: { text: "", color: "#C4C4C4" },
        type: label.type,
      };

    case "members":
      return { taskId, labelId: label.id, value: [], type: label.type };

    case "date": {
      return { taskId, labelId: label.id, value: null, type: label.type };
    }

    default:
      return null;
  }
}

function getGroupsColors() {
  const colors = [
    "#037F4C",
    "#00C875",
    "#9CD326",
    "#CAB641",
    "#FFCB00",
    "#784BD1",
    "#9D50DD",
    "#007EB5",
    "#579BFC",
    "#66CCFF",
    "#BB3354",
    "#DF2F4A",
    "#FF007F",
    "#FF5AC4",
    "#FF642E",
    "#FDAB3D",
    "#7F5347",
    "#C4C4C4",
    "#757575",
  ];

  return colors;
}
