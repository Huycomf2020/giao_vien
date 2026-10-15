const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createModel } = require('../cong_cu/quiz-assets/golden-bell.js');
const pupils = n => Array.from({length:n},(_,i)=>({id:i+1,name:'Học sinh '+(i+1)}));
test('only correct, still active students remain; unknown and eliminated cards cannot rejoin',()=>{
 const m=createModel(pupils(5),[0,1,2]);
 assert.equal(m.next(),false);
 assert.equal(m.submitCount({1:{choice:'A'},2:{choice:'X'},99:{choice:'A'}}),1);
 assert.deepEqual(m.lock({1:{choice:'A'},2:{choice:'A'},3:{choice:'A'},4:{choice:'B'},99:{choice:'A'}},'A'),{alive:[1,2,3],dropped:[4,5],outcome:'continue'});
 assert.equal(m.lock({},'A'),null);assert.equal(m.history.length,1);assert.equal(m.next(),true);
 assert.deepEqual(m.lock({1:{choice:'B'},2:{choice:'C'},4:{choice:'B'},5:{choice:'B'}},'B'),{alive:[1],dropped:[2,3],outcome:'winner'});
 assert.equal(m.next(),false);
});
test('all wrong has no winner; undo restores only the previous round survivor set',()=>{
 const m=createModel(pupils(4),[0,1]);m.lock({1:{choice:'A'},2:{choice:'A'},3:{choice:'A'}},'A');m.next();
 assert.equal(m.lock({1:{choice:'A'},2:{choice:'A'},3:{choice:'A'}},'D').outcome,'empty');assert.equal(m.alive.size,0);
 assert.equal(m.undo(),true);assert.deepEqual([...m.alive],[1,2,3]);assert.equal(m.history.length,1);assert.equal(m.undo(),false);
 assert.equal(m.lock({2:{choice:'D'}},'D').outcome,'winner');assert.deepEqual([...m.alive],[2]);
});
test('final question gives co-winners; no arbitrary tie breaker',()=>{
 const m=createModel(pupils(60),[0]);const a=Object.fromEntries(pupils(60).map(s=>[s.id,{choice:'C'}]));assert.equal(m.lock(a,'C').outcome,'finalists');assert.equal(m.alive.size,60);assert.equal(m.next(),false);
});
test('one participant must answer correctly to win; zero responses cannot win',()=>{
 const m=createModel(pupils(1),[0]);assert.equal(m.lock({},'A').outcome,'empty');m.undo();assert.equal(m.lock({1:{choice:'A'}},'A').outcome,'winner');
});
test('input validation and roster isolation',()=>{
 assert.throws(()=>createModel([], [0]));assert.throws(()=>createModel(pupils(2), []));assert.throws(()=>createModel([{id:1,name:'A'},{id:1,name:'B'}],[0]));
 const list=pupils(2),order=[0,1],m=createModel(list,order);list[0].name='changed';order.pop();assert.equal(m.students[0].name,'Học sinh 1');assert.equal(m.order.length,2);assert.throws(()=>m.lock({},'E'));
});
