import assert from 'node:assert/strict';
import {validateInterest,allowedOrigin} from './core.ts';
const valid={name:'Example',email:'TEST@example.com',business:'Example Ltd',needs:'Help with research tasks',consent:true};
assert.equal(validateInterest(valid)?.email,'test@example.com');
for(const invalid of [null,{}, {...valid,consent:false},{...valid,email:'bad'},{...valid,needs:'short'},{...valid,name:'x'.repeat(121)}])assert.equal(validateInterest(invalid),null);
assert.ok(allowedOrigin('https://agenticcore.biz'));assert.ok(!allowedOrigin('https://agenticcore.biz.evil.test'));assert.ok(!allowedOrigin('null'));assert.ok(allowedOrigin('https://deploy-preview-1--agenticcore-biz.netlify.app','https://deploy-preview-1--agenticcore-biz.netlify.app'));
console.log('PASS waitlist validation, consent, bounded fields and exact origin controls');
