import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import scss from './treeDnd.module.scss';
import clsx from 'clsx';
import TreeView from '@material-ui/lab/TreeView';
import CloseIcon from '@material-ui/icons/Close';
import SaveIcon from '@material-ui/icons/Save';
import TreeItem from '@material-ui/lab/TreeItem';
import TextField from '@material-ui/core/TextField';
import IconButton from '@material-ui/core/IconButton';

let data = [{
  id: 'root',
  name: 'Top Level 1',
  children: [
    {
      id: '1',
      name: 'Child - 1',
    },
    {
      id: '3',
      name: 'Child - 3',
      children: [
        {
          id: '4',
          name: 'Child - 4',
          children: [
            {
              id: '5',
              name: 'Child - 5',
              children: [
                {
                  id: '6',
                  name: 'Child - 6',
                },
              ],
            },
            {
              id: '52',
              name: 'Child - 52',
            },
            {
              id: '53',
              name: 'Child - 53',
            },
            {
              id: '54',
              name: 'Child - 54',
            },
            {
              id: '55',
              name: 'Child - 55',
            },
          ],
        },
      ],
    },
  ],
},{
    id: 'top2',
    name: 'Top Level 2',
    children: [
        {
            id: '21',
            name: 'child 21',
        },
        {
            id: '22',
            name: 'child 22',
            children: [
                {
                    id: '221',
                    name: 'child 221',
                },
                {
                    id: '222',
                    name: 'child 222',
                }
            ]
        },
        {
            id: '23',
            name: 'child 23',
        },
    ],
},{
    id: 'top3',
    name: 'Top Level 3',
},{
    id: 'top4',
    name: 'Top Level 4',
},{
    id: 'top5',
    name: 'Top Level 5',
},{
    id: 'top6',
    name: 'Top Level 6',
}
];

const findNestedIndexById = (arr,searchForId) => {
    let nestedIndex;
    let ids;

    for(let i = 0; i < arr.length; i++) {
        if(arr[i].id === searchForId) {
            return [i,arr[i].id];
        } else if(arr[i].children && Array.isArray(arr[i].children)) {
            [nestedIndex, ids] = findNestedIndexById(arr[i].children,searchForId);
            if(nestedIndex === -1) continue;
            
            if(Array.isArray(nestedIndex)) {
                nestedIndex.unshift(i);
                ids.unshift(arr[i].id);
                return [[...nestedIndex],[...ids]];
            }
            
            return [[i, nestedIndex],[arr[i].id, ids]];
        } else {
            continue;
        }
    }
    return [-1,-1];
}
const findAndRemoveById = (arr,searchForId) => {
    // This assumes all children are moving with
    let removed;
    
    for(let i = 0; i < arr.length; i++) {
        if(arr[i].id === searchForId) {
            return arr.splice(i,1)[0];
        } else if(arr[i].children && Array.isArray(arr[i].children)) {
            removed = findAndRemoveById(arr[i].children,searchForId);
            if(removed === -1) continue;
            
            return removed;
        }
    }
    return -1; // This should not occur, safety net
}

const findDropSpotReferenceById = (arr, searchForId) => {
    // searchForId should be the second to last ID in the [dropPathIds] array
    let arrToFind;
    for(let i = 0; i < arr.length; i++) {
        if(arr[i].id === searchForId) {
            return arr;
        } else if(arr[i].children && Array.isArray(arr[i].children)) {
            arrToFind = findDropSpotReferenceById(arr[i].children,searchForId);
            if(arrToFind === -1) continue;
            
            return arrToFind;
        }
    }
    return -1; // This should not occur, safety net and debug purposes
};

const deepCopyNestedObjArr = (arr) => {
    return arr.map((obj)=>{
        let tempObj = {...obj}
        if(tempObj.hasOwnProperty('children')) {
            tempObj.children = deepCopyNestedObjArr(tempObj.children);
            return tempObj;
        } else {
            return {...tempObj}
        }
    });
}

// STYLING FOR MUI TEXTFIELD
const useStyles = makeStyles(theme => ({
    outlinedRoot: {
        marginLeft:6,
        '& $input': {
            padding:'5.25px!important',
        },
        '&$focused $notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: 1,
        },
    },
    input:{},
    notchedOutline: {},
    focused: {},
}));

const TreeNode = ({node,renderTree,handleOnDragStart,handleOnDrop,draggedNodeRef}) => {
    const [edit, toggleEdit] = React.useState(false);
    const [ghostState, setGhostState] = React.useState({top:false,bot:false,addChild:false, clientY:0,clientX:0});

    // get the altered MUI Styles
    const classes = useStyles();
    const refClickCount = React.useRef(0);
    const componentRef = React.useRef(null);

    const handleOnclick = ( n ) => ( e ) => {
        refClickCount.current = (refClickCount.current+1);
        if(refClickCount.current < 2) {
            setTimeout(() => {
                if(refClickCount.current >= 2) {
                    toggleEdit(true);
                    refClickCount.current = 0;
                    return;
                } else {
                    if(edit) toggleEdit(false);
                    refClickCount.current = 0;
                }
            }, 300);
        }
    };
    const handleDragLeave = (e) => {
        if(e.clientY===ghostState.clientY) return;
        e.stopPropagation();
        e.preventDefault();
        setGhostState({top:false,bot:false,clientY:0});
    }
    const handleDragOver = (e) => {
        e.stopPropagation();
        e.preventDefault();
        let rect = e.target.getBoundingClientRect(); //maybe cache this to a reference
        if(e.clientX > (rect.right*0.70)) {
            if(ghostState.addChild) return; 
            else 
            setGhostState({top:false,bot:true,addChild:true,clientY:0});
        } else {
            if(e.clientY > (rect.top+13) && e.clientY < (rect.bottom)) {
                //bottom half
                if(ghostState.bot) return;
                else 
                    setGhostState({top:false,bot:true,clientY:0});
            } else {
                //top half
                if(ghostState.top) return;
                else 
                    setGhostState({top:true,bot:false,clientY:e.clientY});
            }
        }
    }
    const handleDragDrop = (e) => {
        setGhostState({top:false,bot:false,addChild:false});
        handleOnDrop(e,node, ghostState.top, ghostState.addChild);
    }
    const InputProps = {
        classes: {
            root:classes.outlinedRoot,
            notchedOutline: classes.notchedOutline,
            focused: classes.focused,
            input: classes.input
        },
    };

    // on doubleclick draggedNodeRef becomes undefined, no idea why
    let selfDrop = (draggedNodeRef && draggedNodeRef.current !== null) ? (draggedNodeRef.current.id === node.id) : null;

    if(edit) {
        return (
            <React.Fragment>
            <div className={scss.treeItemEdit}>
            <TextField
                InputProps={InputProps}
                ref={componentRef}
                key={node.id}
                label={''}
                InputLabelProps={{ shrink: false }}
                id="outlined-margin-dense"
                placeholder={node.name}
                margin="dense"
                variant="outlined"
            />
            <IconButton aria-label="delete" size="small">
              <SaveIcon fontSize="inherit" />
            </IconButton>
            <IconButton onClick={()=>toggleEdit(false)} aria-label="delete" size="small">
              <CloseIcon fontSize="inherit" />
            </IconButton>
            </div>
            </React.Fragment>
        );
    } else {
        return (
            <React.Fragment > 
                <div
                    className={scss.wrapper}
                    onDragOver={(e)=>{handleDragOver(e);}}
                    onDragLeave={(e)=>{handleDragLeave(e);}}
                >
                    
                    {ghostState.top &&
                        <div
                            className={scss.ghostTreeItem}
                            onClick={()=>{return false;}}
                            onDrop={(e)=>{handleDragDrop(e);}}
                        >
                                <span>{draggedNodeRef.current.name}</span>
                        </div>
                    }
                    <TreeItem
                        className={clsx({[scss.noSelfDrop]:selfDrop},scss.treeItem)}
                        draggable
                        onDragStart={(e)=>handleOnDragStart(e,node)}
                        onDrop={handleDragDrop}
                        ref={componentRef} 
                        onClick={handleOnclick(node)} 
                        key={node.id} 
                        nodeId={node.id} 
                        label={node.name}
                    >
                        {Array.isArray(node.children) ? renderTree(node.children,handleOnDragStart,handleOnDrop,draggedNodeRef) : null}
                    </TreeItem>
                    {ghostState.bot &&
                        <div
                            className={clsx(scss.ghostTreeItem,{[scss.ghostTreeItemAddChild]:ghostState.addChild})}
                            onClick={()=>{return false;}}
                            onDrop={(e)=>{handleDragDrop(e);}}
                        >
                                <span>{draggedNodeRef.current.name}</span>
                        </div>
                    }
                </div>
            </React.Fragment>
        );
    }
};

export default function RecursiveTreeView() {
  const [shake,shakeTree] = React.useState(false);
  const draggedNodeRef = React.useRef(null);
  const forceUpdate = React.useState(false)[1];
  const handleShakeTree = React.useCallback(()=>shakeTree(oldVal => !oldVal),[]);
  const handleForceUpdate = React.useCallback(()=>forceUpdate(oldVal => !oldVal),[]);

  const renderTree = (nodes,handleOnDragStart,handleOnDrop,draggedNodeRef) => {
    return nodes.map(node => {
        return (
            <TreeNode
                key={node.id} 
                handleOnDragStart={handleOnDragStart}
                handleOnDrop={handleOnDrop}
                node={node}
                renderTree={renderTree}
                draggedNodeRef={draggedNodeRef}
            />
        )
    })
  };
  const handleOnDragStart = React.useCallback((e,node) => {
    e.stopPropagation();
    draggedNodeRef.current = node;
  },[]);

  const handleOnDrop = React.useCallback((e,node,dropAbove, addChild)=> {
    e.stopPropagation();e.preventDefault();
    let [idxDropPath, dropPathIds] = findNestedIndexById(data,node.id);
    let idxDragPath= findNestedIndexById(data,draggedNodeRef.current.id)[0];
    
    // return on self drop
    if(draggedNodeRef.current.id === node.id) {
        draggedNodeRef.current = null;
        return;
    }
    
    let deepCopyOfData = deepCopyNestedObjArr(data);

    let removed;
    let childOfTopLevelSelf;
    let childOfSelf;
    let setData = false;

    ///// NEEDED FUNCTIONALITY ////
    //  [√] intert at above/below line
    //  [√] insert below line, create child array
    //  [√] insert in child array
    ///////////////////////////////

    let dpID = !Array.isArray(dropPathIds) ? dropPathIds : dropPathIds[dropPathIds.length-1];

    let lengthBeforeRemoval = findDropSpotReferenceById(deepCopyOfData,dpID).length;

    // Remove From Data Clone
    if(!Array.isArray(idxDragPath)) {
        // top level
        removed = deepCopyOfData.splice(idxDragPath,1)[0]; //remove
    } else {
        // Passed arrays work by reference
        removed = findAndRemoveById(deepCopyOfData,draggedNodeRef.current.id);
    }
    let dropAt;
    let lengthAfterRemoval = findDropSpotReferenceById(deepCopyOfData,dpID).length;
    let additional = lengthBeforeRemoval === lengthAfterRemoval;
 
    if(addChild) {
        dropAt = 0;
    } else {
        if(dropAbove) {
            dropAt = !Array.isArray(idxDropPath) ? idxDropPath - 1 : (idxDropPath[idxDropPath.length-1])-1;
            if(additional) dropAt += 1;

        } else {
            dropAt = !Array.isArray(idxDropPath) ? idxDropPath : idxDropPath[idxDropPath.length-1];
            if(dropAt === 0 && !additional) dropAt += 1;
            // dropAt = !Array.isArray(idxDropPath) ? (idxDropPath === 0 ?  idxDropPath + 1 : idxDropPath) : (idxDropPath[idxDropPath.length-1] === 0 ? idxDropPath[idxDropPath.length-1] + 1: idxDropPath[idxDropPath.length-1]);
            if(additional) dropAt += 1;
        }
    }

    if(dropAt<=-1) dropAt = 0;


    ///////////////////////////////
    // MOVE DATA TO NEW LOCATION //
    ///////////////////////////////
    
    let [newIdxDropPath, newDropPathIds] = findNestedIndexById(deepCopyOfData,node.id);

    if(!Array.isArray(idxDropPath)) {
        // top level
        if(addChild) {
            if(deepCopyOfData[newIdxDropPath].children) {
                deepCopyOfData[newIdxDropPath].children.splice(0,0,removed);
            } else {
                deepCopyOfData[newIdxDropPath].children = [];
                deepCopyOfData[newIdxDropPath].children.push(removed);
            }
        } else {
            deepCopyOfData.splice(dropAt,0,removed); //insert
        }
        setData = true;
    } else {
        // if top level parent becomes child of self
        childOfTopLevelSelf = data[idxDropPath[0]].id === draggedNodeRef.current.id ? true : false;
        childOfSelf = dropPathIds.includes(draggedNodeRef.current.id);

        if(childOfTopLevelSelf){
            
            handleShakeTree();
            setTimeout(()=>{
                handleShakeTree();
            },500);
            // console.log('TOP LEVEL OF SELF');
            // deepCopyChildrenTemp = deepCopyNestedObjArr(data[idxDropPath[0]].children);
            // delete removed.children;

            // if(idxDropPath.length > 2) {
            //     for(let i=1; i<(idxDropPath.length-1); i++) {
            //         if(nestedDropLocationReference === 0) {
            //             nestedDropLocationReference = deepCopyChildrenTemp[idxDropPath[i]].children;
            //         }
            //         else {
            //             nestedDropLocationReference = nestedDropLocationReference[idxDropPath[i]].children;
            //         }
            //     }
            // } else {
            //     // the length is 2
            //     nestedDropLocationReference = deepCopyChildrenTemp;
            // }
            // nestedDropLocationReference.splice(idxDropPath[idxDropPath.length-1],0,removed);
            // for(let j = deepCopyChildrenTemp.length-1; j>=0; j--) {
            //     deepCopyOfData.splice(idxDropPath[0],0,deepCopyChildrenTemp.pop()); //insert
            // }
        } else if(childOfSelf) {
            // if becoming child of myself somewhere
            handleShakeTree();
            setTimeout(()=>{
                handleShakeTree();
            },500);
            // deepCopyChildrenTemp = deepCopyNestedObjArr(removed.children);
            // delete removed.children;

            // let dropSpotRef = findDropSpotReferenceById(deepCopyChildrenTemp,dropPathIds[dropPathIds.length-1]);
            
            // if(idxDragPath.lenght > 2) {
            //     for(let i; i<idxDragPath.length -1; i++) {
            //         if(i === idxDragPath.length - 2) {
            //             break;
            //         } else if(nestedDragLocationRef === 0) {
            //             nestedDragLocationRef = deepCopyOfData[idxDragPath[i]].children;
            //         } else {
            //             nestedDragLocationRef = nestedDragLocationRef[idxDragPath[i]].children;
            //         }
            //     }
            // } else {
            //     nestedDragLocationRef = deepCopyOfData[idxDragPath[0]].children;
            // }

            // console.log('REFERENCES', dropSpotRef,nestedDragLocationRef);

            // dropSpotRef.splice(idxDropPath[idxDropPath.length-1],0,removed);

            // for(let j = deepCopyChildrenTemp.length-1; j>=0; j--) {
            //     nestedDragLocationRef.splice(idxDragPath[idxDragPath.length-1],0,deepCopyChildrenTemp.pop()); //insert
            // }
        // } else if ( dropOnRight ) {

        // }
        } else {
            // being nested into some other path
            let dropSpotRefArr = findDropSpotReferenceById(deepCopyOfData,dropPathIds[dropPathIds.length-1]);
            
            let tmpAr = [];
            
            if(addChild) {
                if(dropSpotRefArr[newIdxDropPath[newIdxDropPath.length-1]].hasOwnProperty('children')) {
                    dropSpotRefArr[newIdxDropPath[newIdxDropPath.length-1]].children.splice(0,0,removed);
                } else {
                    tmpAr.push(removed);
                    dropSpotRefArr[newIdxDropPath[newIdxDropPath.length-1]].children = deepCopyNestedObjArr(tmpAr);
                }
            } else {
                dropSpotRefArr.splice(dropAt,0,removed);
            }
            setData = true;
        }
    }

    if(setData) {
    // final clone to replace current data with new arrangement
        data = deepCopyNestedObjArr(deepCopyOfData);
        handleForceUpdate();
    }
    draggedNodeRef.current = null;
  },[]);
  return (
    <TreeView
      className={clsx({[scss.shakeTree]:shake},scss.root)}
    >
      {renderTree(data,handleOnDragStart,handleOnDrop,draggedNodeRef)}
    </TreeView>
  );
}