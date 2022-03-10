module.exports.parse = async (
  { content, name, url },
  { axios, yaml, notify }
) => {
  // ----------自定义区域----------
  // 自定义规则
  // 规则示例
  var customGroups = [
    {
      name: '🎮 Steam',
      ruleType: 'DOMAIN-SUFFIX',
      domains: [
        'steampowered.com',
        'steam-chat.com',
        'steamgames.com',
        'steamusercontent.com',
        'steamcontent.com',
        'steamstatic.com',
        'steamcdn-a.akamaihd.net',
        {
          domain: 'steamcommunity.com',
          type: 'DOMAIN-SUFFIX'
        }
      ],
      replacePattern: /steam\S*\.(com|net)/g
    }
  ];
  // 手动指定主要组名称
  var mainProxyGroupName = '';
  // ----------结束----------

  // 根据URL生成rules
  // var generateRules = group => group.domains.map(item => 'DOMAIN-SUFFIX,' + item + ',' + group.name);
  var generateRules = group => {
    var ret = [];
    var defaultRuleType = typeof (group.ruleType != typeof (undefined)) ? group.ruleType : 'DOMAIN-SUFFIX';
    for(var i = 0; i < group.domains.length; i++)
    {
      if(typeof(group.domains[i]) == typeof(''))
      {
        ret.push(defaultRuleType + ',' + group.domains[i] + ',' + group.name);
      }
      else
      {
        ret.push(group.domains[i].type + ',' + group.domains[i].domain + ',' + group.name);
      }
    }
    return ret;
  };

  // 读取proxies
  var getProxyNames = () => content.proxies.map(item => item.name);

  // 读取主proxy-group的名称
  var getMainProxyName = () => {
    if (typeof (mainProxyGroupName) != typeof (undefined) && mainProxyGroupName != null && mainProxyGroupName != '') {
      return mainProxyGroupName;
    }
    else {
      return content['proxy-groups'][0].name;
    }
  };

  // 生成proxy-group
  var generateProxyGroup = groupName => {
    return {
      name: groupName,
      type: 'select',
      proxies: [getMainProxyName(), 'DIRECT', 'REJECT'].concat(getProxyNames())
    };
  };

  // 从rule中取得域名
  var getDomainFromRule = rule => rule.substring(rule.indexOf(',') + 1, rule.lastIndexOf(','));

  for (var i = 0; i < customGroups.length; i++) {
    var currentGroup = customGroups[i];
    // 添加proxy-group
    content['proxy-groups'].splice(1 + i, 0, generateProxyGroup(currentGroup.name));

    var useRegexPattern = typeof ((currentGroup.replacePattern) != typeof (undefined) && currentGroup.replacePattern != null);
    useRegexPattern = false;
    // 删除已有的rules
    for (var j = 0; j < content.rules.length; j++) {
      var currentRule = content.rules[j];
      // 使用正则
      if (useRegexPattern) {
        if (currentGroup.replacePattern.test(currentRule)) {
          content.rules.splice(i, 1);
        }
      }
      // 使用urls列表
      else {
        var currentDomain = getDomainFromRule(currentRule);
        if (currentGroup.domains.indexOf(currentDomain) != -1) {
          content.rules.splice(i, 1);
        }
      }
    }

    // 添加自定义rules
    var rules = generateRules(currentGroup);
    for (var j = 0; j < rules.length; j++) {
      content.rules.unshift(rules[j]);
    }
  }

  notify('提示', '载入了' + customGroups.length + '个自定义规则', false);
  return content;
};