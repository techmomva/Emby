define(["events","playbackManager","connectionManager","playMethodHelper","layoutManager","serverNotifications","paper-icon-button-light","css!./playerstats"],function(events,playbackManager,connectionManager,playMethodHelper,layoutManager,serverNotifications){"use strict";function init(instance){var parent=document.createElement("div");parent.classList.add("playerStats"),parent.classList.add("hide");var button;button=layoutManager.tv?"":'<button type="button" is="paper-icon-button-light" class="playerStats-closeButton"><i class="md-icon">close</i></button>',parent.innerHTML='<div class="playerStats-content">'+button+'<div class="playerStats-stats"></div></div>',button=parent.querySelector(".playerStats-closeButton"),button&&button.addEventListener("click",onCloseButtonClick.bind(instance)),document.body.appendChild(parent),instance.element=parent}function onCloseButtonClick(){this.enabled(!1)}function renderStats(elem,categories){elem.querySelector(".playerStats-stats").innerHTML=categories.map(function(category){var categoryHtml="",stats=category.stats;stats.length&&category.name&&(categoryHtml+='<div class="playerStats-stat playerStats-stat-header">',categoryHtml+='<div class="playerStats-stat-label">',categoryHtml+=category.name,categoryHtml+="</div>",categoryHtml+="</div>");for(var i=0,length=stats.length;i<length;i++){categoryHtml+='<div class="playerStats-stat">';var stat=stats[i];categoryHtml+='<div class="playerStats-stat-label">',categoryHtml+=stat.label,categoryHtml+="</div>",categoryHtml+='<div class="playerStats-stat-value">',categoryHtml+=stat.value,categoryHtml+="</div>",categoryHtml+="</div>"}return categoryHtml}).join("")}function getSession(instance,player){var now=(new Date).getTime();if(now-(instance.lastSessionTime||0)<1e4)return Promise.resolve(instance.lastSession);var apiClient=connectionManager.getApiClient(playbackManager.currentItem(player).ServerId);return apiClient.getSessions({deviceId:apiClient.deviceId()}).then(function(sessions){return instance.lastSession=sessions[0]||{},instance.lastSessionTime=(new Date).getTime(),Promise.resolve(instance.lastSession)},function(){return Promise.resolve({})})}function getSessionStats(session,player,displayPlayMethod){var videoCodec,audioCodec,totalBitrate,audioChannels,sessionStats=[];if(session.TranscodingInfo)videoCodec=session.TranscodingInfo.VideoCodec,audioCodec=session.TranscodingInfo.AudioCodec,totalBitrate=session.TranscodingInfo.Bitrate,audioChannels=session.TranscodingInfo.AudioChannels;else{var mediaSource=playbackManager.currentMediaSource(player);mediaSource&&(totalBitrate=mediaSource.Bitrate);var mediaStreams=mediaSource.MediaStreams||[],videoStream=mediaStreams.filter(function(s){return"Video"===s.Type})[0]||{};videoCodec=videoStream.Codec;var audioStreamIndex=playbackManager.getAudioStreamIndex(player),audioStream=playbackManager.audioTracks(player).filter(function(s){return"Audio"===s.Type&&s.Index===audioStreamIndex})[0]||{};audioCodec=audioStream.Codec,audioChannels=audioStream.Channels}return videoCodec&&sessionStats.push({label:"Video codec:",value:videoCodec}),audioCodec&&sessionStats.push({label:"Audio codec:",value:audioCodec}),audioChannels&&sessionStats.push({label:"Audio channels:",value:audioChannels}),totalBitrate&&(totalBitrate>1e6?sessionStats.push({label:"Bitrate:",value:(totalBitrate/1e6).toFixed(1)+" Mbps"}):sessionStats.push({label:"Bitrate:",value:Math.floor(totalBitrate/1e3)+" kbps"})),session.TranscodingInfo&&"Transcode"===displayPlayMethod&&(session.TranscodingInfo.CompletionPercentage&&sessionStats.push({label:"Transcoding progress:",value:session.TranscodingInfo.CompletionPercentage.toFixed(1)+"%"}),session.TranscodingInfo.Framerate&&sessionStats.push({label:"Transcoding framerate:",value:session.TranscodingInfo.Framerate+" fps"}),session.TranscodingInfo.TranscodeReasons&&session.TranscodingInfo.TranscodeReasons.length&&sessionStats.push({label:"Reason for transcoding:",value:session.TranscodingInfo.TranscodeReasons.join(",")})),sessionStats}function getStats(instance,player){var statsPromise=player.getStats?player.getStats():Promise.resolve([]),sessionPromise=getSession(instance,player);return Promise.all([statsPromise,sessionPromise]).then(function(responses){var playerStats=responses[0],session=responses[1],displayPlayMethod=playMethodHelper.getDisplayPlayMethod(session);playerStats.unshift({label:"Play method:",value:displayPlayMethod}),playerStats.unshift({label:"Player:",value:player.name});var categories=[];return categories.push({stats:playerStats}),categories.push({stats:getSessionStats(session,player,displayPlayMethod)}),Promise.resolve(categories)})}function renderPlayerStats(instance,player){var now=(new Date).getTime();now-(instance.lastRender||0)<700||(instance.lastRender=now,getStats(instance,player).then(function(stats){var elem=instance.element;elem&&renderStats(elem,stats)}))}function bindEvents(instance,player){var localOnTimeUpdate=function(){renderPlayerStats(instance,player)};instance.onTimeUpdate=localOnTimeUpdate,events.on(player,"timeupdate",localOnTimeUpdate)}function unbindEvents(instance,player){var localOnTimeUpdate=instance.onTimeUpdate;localOnTimeUpdate&&events.off(player,"timeupdate",localOnTimeUpdate)}function PlayerStats(options){this.options=options,init(this),this.enabled(!0)}return PlayerStats.prototype.enabled=function(enabled){if(null==enabled)return this._enabled;var options=this.options;options&&(this._enabled=enabled,enabled?(this.element.classList.remove("hide"),bindEvents(this,options.player)):(this.element.classList.add("hide"),unbindEvents(this,options.player)))},PlayerStats.prototype.toggle=function(){this.enabled(!this.enabled())},PlayerStats.prototype.destroy=function(){var options=this.options;options&&(this.options=null,unbindEvents(this,options.player));var elem=this.element;elem&&(elem.parentNode.removeChild(elem),this.element=null)},PlayerStats});