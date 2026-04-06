import sys
import re

with open(r'c:\Users\rabot\OneDrive\Desktop\Z CRM\skamsite-main\src\components\finance\ReportsTab.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace manager.team === 'voha' and other simple team name replacements
text = text.replace('\'voha\'', '\'zet\'')
text = text.replace('Команда Вохи', 'Команда Зета')
text = text.replace('Воха', 'Зет')

# Replace vohaStats usages
text = text.replace('vohaStats.totalRevenue', 'zetStats.totalRevenue')
text = text.replace('vohaStats.operationsCount > 0 ? vohaStats.totalRevenue / vohaStats.operationsCount : 0', 'zetStats.operationsCount > 0 ? zetStats.totalRevenue / zetStats.operationsCount : 0')
text = text.replace('vohaStats.operationsCount', 'zetStats.operationsCount')
text = text.replace('vohaStats.netProfit', 'zetStats.netProfit')
text = text.replace('vohaStats.teamSalaries', 'zetStats.teamSalaries')
text = text.replace('vohaStats.personalExpenses', 'zetStats.personalExpenses')
text = text.replace('vohaStats.commonExpenses', 'zetStats.commonExpenses')
text = text.replace('vohaStats.techExpenses', 'zetStats.techExpenses')
text = text.replace('vohaStats.fixedExpenses', 'zetStats.fixedExpenses')
text = text.replace('vohaStats.totalExpenses', 'zetStats.totalExpenses')

text = text.replace('vohaStats.', 'zetStats.')

with open(r'c:\Users\rabot\OneDrive\Desktop\Z CRM\skamsite-main\src\components\finance\ReportsTab.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
