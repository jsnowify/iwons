import {describe,it,expect} from 'vitest';
import {binarySearchFrames,linearSearchFrames,insertionSortFrames,bubbleSortFrames,selectionSortFrames,mergeSortFrames,quickSortFrames,gridBfsFrames,gridDfsFrames} from '../lib/visualizers';
describe('visualizer algorithms',()=>{
 for(const [name,sort] of Object.entries({insertionSortFrames,bubbleSortFrames,selectionSortFrames,mergeSortFrames,quickSortFrames})){
  it(`${name} finishes sorted without mutating input`,()=>{
   for(const input of [[],[7],[3,1,3,-2,0],[5,4,3,2,1],[1,2,3,4]]){
    const original=[...input],frames=sort(input);expect(frames.length).toBeGreaterThan(0);expect(input).toEqual(original);
    expect(frames.at(-1)!.cells.map(cell=>Number(cell.value))).toEqual([...input].sort((a,b)=>a-b));
   }
  });
 }
 for(const search of [binarySearchFrames,linearSearchFrames])it(`${search.name} distinguishes a found target from an absent target`,()=>{
  expect(search([1,3,5,7],5).at(-1)!.message).toContain('Found 5 at index 2');
  expect(search([1,3,5,7],4).at(-1)!.message).toContain('absent');expect(search([],4).at(-1)!.message).toContain('absent');
 });
 it('BFS and DFS reach the same open component without entering walls',()=>{
  const grid=[[0,0,1,0],[1,0,1,0],[0,0,1,0]],copy=structuredClone(grid);
  const paths=[gridBfsFrames(grid,[0,0]),gridDfsFrames(grid,[0,0])];
  for(const frames of paths){expect(frames.at(-1)!.cells.filter(cell=>cell.visited).map(cell=>cell.id).sort()).toEqual(['0,0','0,1','1,1','2,0','2,1']);for(const frame of frames)expect(frame.cells.filter(cell=>cell.value==='■').every(cell=>!cell.visited&&!cell.highlighted)).toBe(true);}
  expect(grid).toEqual(copy);
 });
 it('DFS handles blocked, invalid and empty starts',()=>{expect(gridDfsFrames([], [0,0])).toEqual([]);expect(gridDfsFrames([[1]], [0,0])[0].message).toContain('outside');expect(gridDfsFrames([[0]], [-1,0])[0].message).toContain('outside');expect(()=>gridDfsFrames([[0],[0,0]],[0,0])).toThrow('equal width');});
});
