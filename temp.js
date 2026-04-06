const fs = require('fs');

const path = 'c:\\Users\\rabot\\OneDrive\\Desktop\\Z CRM\\skamsite-main\\src\\components\\finance\\ReportsTab.tsx';
let text = fs.readFileSync(path, 'utf8');

// Replace manager.team === 'voha' and other simple team name replacements
text = text.replace(/'voha'/g, "'zet'");
text = text.replace(/Команда Вохи/g, 'Команда Зета');
text = text.replace(/Воха/g, 'Зет');

// Replace vohaStats usages
text = text.replace(/vohaStats\.totalRevenue/g, 'zetStats.totalRevenue');
text = text.replace(/vohaStats\.operationsCount > 0 \? vohaStats\.totalRevenue \/ vohaStats\.operationsCount : 0/g, 'zetStats.operationsCount > 0 ? zetStats.totalRevenue / zetStats.operationsCount : 0');
text = text.replace(/vohaStats\.operationsCount/g, 'zetStats.operationsCount');
text = text.replace(/vohaStats\.netProfit/g, 'zetStats.netProfit');
text = text.replace(/vohaStats\.teamSalaries/g, 'zetStats.teamSalaries');
text = text.replace(/vohaStats\.personalExpenses/g, 'zetStats.personalExpenses');
text = text.replace(/vohaStats\.commonExpenses/g, 'zetStats.commonExpenses');
text = text.replace(/vohaStats\.techExpenses/g, 'zetStats.techExpenses');
text = text.replace(/vohaStats\.fixedExpenses/g, 'zetStats.fixedExpenses');
text = text.replace(/vohaStats\.totalExpenses/g, 'zetStats.totalExpenses');

text = text.replace(/vohaStats\./g, 'zetStats.');

fs.writeFileSync(path, text, 'utf8');
console.log("Done");
