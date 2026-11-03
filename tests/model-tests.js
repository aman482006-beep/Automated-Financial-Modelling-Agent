// Browser-console test runner: load the application, then execute this file in the browser console.
// It deliberately tests public calculations rather than private UI functions.
(function(){
 const results=ModelForge.selfTest();
 console.table(results);
 const failed=results.filter(x=>!x.ok);
 if(failed.length) throw new Error(failed.length+' ModelForge checks failed');
 console.log('All '+results.length+' ModelForge checks passed.');
 return results;
})();
