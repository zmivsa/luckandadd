/*
[task_local]
cron: 0 1 1 1 1
jdsupermarket.js, tag=超新星商城 兑换, enabled=true


https://lzbk-isv.isvjcloud.com/jdsupermarket

 */

// 执行次数
let cf = 10;
let exchangeName = '0京豆'

const $ = new Env('超新星商城 兑换');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message = '', messageTitle = '';
if ($.isNode()) {
	Object.keys(jdCookieNode).forEach((item) => {
		cookiesArr.push(jdCookieNode[item])
	})
	if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
	};
	if(JSON.stringify(process.env).indexOf('GITHUB')>-1) process.exit(0)
}else {
	let cookiesData = $.getdata('CookiesJD') || "[]";
	cookiesData = jsonParse(cookiesData);
	cookiesArr = cookiesData.map(item => item.cookie);
	cookiesArr.reverse();
	cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
	cookiesArr.reverse();
	cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}

$.exchangeName = exchangeName
let onMessage = false
$.activityFlag = []
$.isvObfuscator_sign = []
!(async () => {
	if (!cookiesArr[0]) {
		$.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
		return;
	}
	console.log(`兑换商品：${$.exchangeName}`)
	for (let i = 0; i < cookiesArr.length; i++) {
		if (cookiesArr[i]) {
			cookie = cookiesArr[i];
			$.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
			$.index = i + 1;
			$.nickName = '';
			console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
			await getUA()
			await run();
			// break
			let f = true
			for(let i of $.activityFlag){
				if(i){
					f = false
					break
				}
			}
			if(f) break
		}
	}
	if(message){
        $.msg($.name, ``, `${message}`)
        if ($.isNode() && onMessage){
            await notify.sendNotify(`${$.name}`, `${message}`)
		}
	}
})()
	.catch((e) => {
		$.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
		console.log(e)
	})
	.finally(() => {
		$.done();
	})

async function run() {
	try{
		$.isvObfuscatorToken = ''
		$.TOKEN = ''
		$.starScore = 0
		$.lanScore = 0
		$.out = false
		$.JD_superMarket_TOKEN = $.getdata(`JD_superMarket_${$.UserName}_TOKEN`) || {}
		$.JD_superMarket_TOKEN = $.toObj($.JD_superMarket_TOKEN,$.JD_superMarket_TOKEN)
		// if($.JD_superMarket_TOKEN["updateTime"] && $.JD_superMarket_TOKEN["updateTime"] > new Date().getTime() - (1000 * 60 * 60 * 2)){
			$.TOKEN = $.JD_superMarket_TOKEN['TOKEN']
			$.isvObfuscatorToken = $.JD_superMarket_TOKEN['isvObfuscatorToken']
		// }
		if(!$.isvObfuscatorToken) await getToken()
		if(!$.isvObfuscatorToken) return
		if(!$.TOKEN) await login()
		if(!$.TOKEN) return
		await userHomeQuery()
		if(!$.TOKEN) return
		$.scoreType = 1+1
		let flag = true
		do{
			$.scoreType--
			if($.scoreType <= -1) break
			$.activityFlag[$.scoreType] = true
			flag = true
			$.out = false
			$.exchangeStatus = -1
			$.exchangeFlag = false
			$.exchangeId = 0
			$.exchangeName = exchangeName
			await exchangeGoodsList($.scoreType)
			if($.exchangeStatus === 1){
				console.log(`「${$.exchangeName}」已兑换过\n`)
				flag = false
			}else if($.exchangeStatus === 3){
				console.log(`「${$.exchangeName}」已兑换完\n`)
				flag = false
			}else if(!$.exchangeFlag){
				console.log(`${$.scoreType == 1 ? '蓝币' : '星币'}不够\n`)
				flag = false
			}else if($.exchangeStatus === -1){
				console.log(`${$.scoreType == 1 ? '蓝币' : '星币'}获取信息失败\n`)
				flag = false
			}
			if($.exchangeFlag == false || flag == false){
				continue
			}
			console.log(`开始兑换「${$.exchangeName}」\n`)
			$.JDTime = 0
			await getJDTime()
			console.log("本地时间",$.time('HH:mm:ss:S'))
			if(!$.JDTime){
				$.JDTime = new Date().getTime()
				console.log("获取不到京东时间，以本地时间为准")
			}else{
				console.log("京东时间",$.time('HH:mm:ss:S',$.JDTime))
			}
			// 第几分钟开始等待
			let dd = 59
			let ddFlag = false // 是否开启倒计时 false 为不开启 true 为开启
			if(ddFlag && $.time('mm',$.JDTime) == dd){
				let S = 0
				if($.time('S',$.JDTime) < 900){
					S = 900 - $.time('S',$.JDTime)
				}
				console.log(`等待${59-$.time('ss',$.JDTime)}秒${S > 0 && S+'毫秒' || ''}`)
				let ddTime = new Date()
				await $.wait((59-$.time('ss',$.JDTime)) * 1000 +S)
				console.log("等待结束时间",$.time('HH:mm:ss:S',$.JDTime+(new Date().getTime() - ddTime.getTime())))
			}else if(ddFlag && $.time('mm',$.JDTime) == dd+1){
				console.log('无需等待，开始执行')
			}else{
				cf = 3
			}
			if(cf > 0){
				console.log(`执行次数 ${cf}`)
				let arr  = Array.from({length:cf},(_, i)=>1+(i))
				await Promise.all(arr.map((k) => execTask(k)))
			}
			if(!$.out){
				let starScore = $.starScore*1
				let lanScore = $.lanScore*1
				await userHomeQuery()
				if(lanScore > $.lanScore || starScore > $.starScore){
					onMessage = true
					message += `【账号${$.index}】${$.UserName} 成功兑换「${$.exchangeName}」\n`
				}
			}
		}while ($.scoreType >= 0)
	} catch (e) {
		console.log(e)
	}
}

function execTask(i) {
    return new Promise(async resolve => {
        let inDate = new Date()
        try {
            await $.wait((i-1) * 20)
			if($.out) return
			inDate = new Date()
			await exchange()
        } catch (e) {
            console.log(`第${i}次 循环执行任务出现异常: `)
            console.log(e)
        } finally {
			if(!$.out) console.log(`第${i}次 执行完成 🕛 耗时：${(new Date().getTime() - inDate.getTime())/1000}秒`)
            resolve()
        }
    })
}
async function ddTime(t = 1000) {
	var g = 500
	var d = t / g
	if(d > 1){
		for (let i = 0; i < d; i++) {
			if($.out) break
			await $.wait(g)
		}
	}else if(t > 0){
		await $.wait(t)
	}
}
async function exchange() {
	if($.out) return
	return new Promise(resolve => {
		let options = {
			url: `https://lzbk-isv.isvjcloud.com/jdsupermarket/api/shop/exchangeGoods?nw=${new Date().getTime()}`,
			headers: {
				"Accept": "application/json, text/plain, */*",
				"Accept-Encoding": "gzip, deflate, br",
				"Accept-Language": "zh-cn",
				"Content-Type": "application/json;charset=utf-8",
				"Cookie": `IsvToken=${$.isvObfuscatorToken}`,
				"TOKEN": $.TOKEN,
				"Origin": "https://lzbk-isv.isvjcloud.com",
				"Referer": "https://lzbk-isv.isvjcloud.com/jdsupermarket/shopping",
				"User-Agent":$.UA,
			},
			body:$.toStr({"targetId":$.exchangeId+""}),
			timeout:10000
		}
		$.post(options, async(err, resp, data) => {
			try {
				if (err) {
					if($.toStr(err,err).indexOf('Timeout awaiting') === -1){
						console.log(`${$.toStr(err)}`)
						console.log(`${$.name} 领豆 API请求失败，请检查网路重试`)
					}
				} else {
					if(!$.out) {
						let res = $.toObj(data,data)
						$.activityFlag[$.scoreType] = true
						if(typeof res == 'object'){
							if(res.code != 200){
								console.log(res.msg)
							}else{
								if(res.data.isLackStock){
									$.out = true
									$.activityFlag[$.scoreType] = false
									console.log('库存不够')
								}else if(res.data.isSuccess){
									$.out = true
									onMessage = true
									console.log(`成功兑换「${$.exchangeName}」🎉`)
									message += `【账号${$.index}】${$.UserName} 成功兑换「${$.exchangeName}」\n`
								}else{
									console.log(data)
								}
							}
						}else{
							console.log(data)
						}
					}
				}
			} catch (e) {
				$.logErr(e, resp)
			} finally {
				resolve();
			}
		})
	})
}
async function userHomeQuery(flag = 0) {
	if($.out) return
	return new Promise(resolve => {
		let options = {
			url: `https://lzbk-isv.isvjcloud.com/jdsupermarket/api/userInfo/userHomeQuery?shareUserId=&nw=${new Date().getTime()}`,
			headers: {
				"Accept": "application/json, text/plain, */*",
				"Accept-Encoding": "gzip, deflate, br",
				"Accept-Language": "zh-cn",
				"Content-Type": "application/json;charset=utf-8",
				"Cookie": `IsvToken=${$.isvObfuscatorToken}`,
				"TOKEN": $.TOKEN,
				"Origin": "https://lzbk-isv.isvjcloud.com",
				"Referer": "https://lzbk-isv.isvjcloud.com/jdsupermarket/shopping",
				"User-Agent":$.UA,
			},
			timeout:10000
		}
		$.get(options, async(err, resp, data) => {
			try {
				if (err) {
					if($.toStr(err,err).indexOf('Timeout awaiting') === -1){
						console.log(`${$.toStr(err)}`)
						console.log(`${$.name} 明细 API请求失败，请检查网路重试`)
					}
				} else {
					if(!$.out) {
						// console.log(data)
						let res = $.toObj(data,data)
						if(typeof res == 'object'){
							if(res.code != 200){
								if(res.msg.indexOf('验证') > -1 && flag == 0){
									console.log('重新登录')
									flag++
									$.TOKEN = ''
									await getToken()
									await login()
									if($.TOKEN) await userHomeQuery(flag)
								}else{
									console.log(res.msg)
								}
							}else{
								$.starScore = res.data.starScore
								$.lanScore = res.data.lanScore
								console.log("星币",addChineseUnit($.starScore,4))
								console.log("蓝币",addChineseUnit($.lanScore,4))
							}
						}else{
							console.log(data)
						}
					}
				}
			} catch (e) {
				$.logErr(e, resp)
			} finally {
				resolve();
			}
		})
	})
}
async function exchangeGoodsList(type = 1) {
	if($.out) return
	// type 1 蓝币 0 星币
	return new Promise(resolve => {
		let options = {
			url: `https://lzbk-isv.isvjcloud.com/jdsupermarket/api/shop/initExchangeGoodsList?exchangeType=${type}&nw=${new Date().getTime()}`,
			headers: {
				"Accept": "application/json, text/plain, */*",
				"Accept-Encoding": "gzip, deflate, br",
				"Accept-Language": "zh-cn",
				"Content-Type": "application/json;charset=utf-8",
				"Cookie": `IsvToken=${$.isvObfuscatorToken}`,
				"TOKEN": $.TOKEN,
				"Origin": "https://lzbk-isv.isvjcloud.com",
				"Referer": "https://lzbk-isv.isvjcloud.com/jdsupermarket/shopping",
				"User-Agent":$.UA,
			},
			timeout:10000
		}
		$.get(options, async(err, resp, data) => {
			try {
				if (err) {
					if($.toStr(err,err).indexOf('Timeout awaiting') === -1){
						console.log(`${$.toStr(err)}`)
						console.log(`${$.name} 奖品列表 API请求失败，请检查网路重试`)
					}
				} else {
					if(!$.out) {
						let res = $.toObj(data,data)
						if(typeof res == 'object'){
							if(res.code != 200){
								console.log(res.msg)
							}else{
								console.log((type == 1 ? '蓝币' : '星币')+'兑换列表')
								console.log('==============================')
								let arr = {
									"2":"京豆",
									"3":"京豆",
								}
								for(let i of res.data){
									let goodsName = i.goodsName
									if(!goodsName){
										goodsName = arr[i.goodsType] || ''
									}
									goodsName = i.beanNum + goodsName
									console.log(`${addChineseUnit(i.score,4)}${type == 1 ? '蓝币' : '星币'} ->`,i.beanNum > 1 ? goodsName : goodsName,"时间?"+i.validTime)
									if($.exchangeName && $.exchangeId == 0 && goodsName.indexOf($.exchangeName) > -1 && ((type == 1 && i.score <= $.lanScore) || (type == 0 && i.score <= $.starScore))){
										$.exchangeStatus = i.status
										$.exchangeName = goodsName
										$.exchangeFlag = true
										$.exchangeId = i.id
									}
								}
								console.log('==============================')
							}
						}else{
							console.log(data)
						}
					}
				}
			} catch (e) {
				$.logErr(e, resp)
			} finally {
				resolve();
			}
		})
	})
}
async function login() {
	console.log('开始登录')
	return new Promise(resolve => {
		let options = {
			url: `https://lzbk-isv.isvjcloud.com/jdsupermarket/api/user-info/login?nw=${new Date().getTime()}`,
			headers: {
				"Accept": "application/json, text/plain, */*",
				"Accept-Encoding": "gzip, deflate, br",
				"Accept-Language": "zh-cn",
				"Content-Type": "application/json;charset=utf-8",
				"Cookie": `IsvToken=${$.isvObfuscatorToken}`,
				"Origin": "https://lzbk-isv.isvjcloud.com",
				"Referer": "https://lzbk-isv.isvjcloud.com/jdsupermarket/",
				"User-Agent":$.UA,
			},
			body:$.toStr({"token":$.isvObfuscatorToken,"source":"01"}),
			timeout:10000
		}
		$.post(options, async(err, resp, data) => {
			try {
				if (err) {
					if($.toStr(err,err).indexOf('Timeout awaiting') === -1){
						console.log(`${$.toStr(err)}`)
						console.log(`${$.name} TOKEN API请求失败，请检查网路重试`)
					}
				} else {
					let res = $.toObj(data,data)
					if(typeof res == 'object'){
						if(res.code != 200){
							console.log(res.msg)
						}
						if(res.data && typeof res.data.token != 'undefined'){
							$.TOKEN = res.data.token
							$.JD_superMarket_TOKEN["updateTime"] = new Date().getTime()
							$.JD_superMarket_TOKEN['TOKEN'] = $.TOKEN
							$.JD_superMarket_TOKEN['isvObfuscatorToken'] = $.isvObfuscatorToken
							$.setdata($.toStr($.JD_superMarket_TOKEN,$.JD_superMarket_TOKEN), `JD_superMarket_${$.UserName}_TOKEN`)
						}
					}else{
						console.log(data)
					}
				}
			} catch (e) {
				$.logErr(e, resp)
			} finally {
				resolve();
			}
		})
	})
}

async function getJDSign(){
	return new Promise(async resolve => {
		let sign = ''
		let options = {
			url: `https://jd.smiek.tk/jdsign_isvob`,
			body:`{"fn":"isvObfuscator","body":${$.toStr({"url":"https://lzbk-isv.isvjcloud.com","id":""})},"token":"super_exchange"}`,
			headers: {
				'Content-Type': 'application/json',
			},
			timeout:10000
		}
        if($.isvObfuscator_sign.length > 5){
            options.timeout = 5000
        }
		$.post(options, async (err, resp, data) => {
			try {
				if (err) {
					if($.isvObfuscator_sign.length > 5){
						sign = $.isvObfuscator_sign[randomNumber(0, $.isvObfuscator_sign.length)]
						resolve(sign)
						return
					}else{
						console.log(`${$.toStr(err)}`)
						console.log(`${$.name} 算法sign API请求失败，请检查网路重试`)
					}
				}else{
					let res = $.toObj(data,data)
					if(typeof res === 'object' && res){
					if(res.code && res.code == 200 && res.data){
						if(res.data.sign) sign = res.data.sign || ''
						if(sign != ''){
							$.isvObfuscator_sign.push(sign)
							resolve(sign)
						}
					}else{
						console.log(data)
					}
					}else{
					console.log(data)
					}
				}
			} catch (e) {
				console.log(e)
			} finally {
				resolve(sign)
			}
		})
	})
}
async function getToken() {
	// console.log('IsvToken')
	$.isvObfuscatorToken = ''
	let body = await getJDSign()
	let opt = {
		url: 'https://api.m.jd.com/client.action?functionId=isvObfuscator',
		headers: {
			'Host': 'api.m.jd.com',
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': '*/*',
			'Connection': 'keep-alive',
			'Cookie': cookie,
			'User-Agent': 'JD4iPhone/167538 (iPhone; iOS 14.3; Scale/3.00)',
			'Accept-Language': 'zh-Hans-CN;q=1',
			'Accept-Encoding': 'gzip, deflate, br',
		},
		body
	}
	return new Promise(resolve => {
		$.post(opt, (err, resp, data) => {
			try {
				if (err) {
					console.log(`${JSON.stringify(err)}`)
				}
				else {
					let res = $.toObj(data,data)
					if(typeof res == 'object'){
						if(res.message){
							console.log(res.message)
						}
						if(typeof res.token != 'undefined') $.isvObfuscatorToken = res.token
					}else{
						console.log(data)
					}
				}
			} catch (e) {
				console.log(e, resp)
			} finally {
				resolve();
			}
		})
	})
}
function getJDTime() {
	return new Promise(resolve => {
		let options = {
			url: `https://lzdz1-isv.isvjcloud.com/common/getSystime`,
		}
		$.get(options, async(err, resp, data) => {
			try {
				if (err) {
					console.log(`${$.toStr(err)}`)
					console.log(`${$.name} JDTime API请求失败，请检查网路重试`)
				} else {
					// console.log(data)
					let res = $.toObj(data,data)
					if(typeof res == 'object'){
						if(typeof res.systime != 'undefined') $.JDTime = res.systime
					}else{
						console.log(`JDTime ${data}`)
					}
				}
			} catch (e) {
				$.logErr(e, resp)
			} finally {
				resolve();
			}
		})
	})
}


async function getUA(){
	$.UA = `jdapp;iPhone;10.2.2;13.1.2;${randomString(40)};M/5.0;network/wifi;ADID/;model/iPhone8,1;addressid/2308460611;appBuild/167863;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1;`
}

function randomString(e) {
  e = e || 32;
  let t = "abcdef0123456789", a = t.length, n = "";
  for (i = 0; i < e; i++)
    n += t.charAt(Math.floor(Math.random() * a));
  return n
}
  
function jsonParse(str) {
	if (typeof str == "string") {
		try {
			return JSON.parse(str);
		} catch (e) {
			console.log(e);
			$.msg($.name, '', '不要在BoxJS手动复制粘贴修改cookie')
			return [];
		}
	}
}

/** 
 * 为数字加上单位：万或亿 
 * 
 * 例如： 
 * 1000.01 => 1000.01 
 * 10000 => 1万 
 * 99000 => 9.9万 
 * 566000 => 56.6万 
 * 5660000 => 566万 
 * 44440000 => 4444万 
 * 11111000 => 1111.1万 
 * 444400000 => 4.44亿 
 * 40000000,00000000,00000000 => 4000万亿亿 
 * 4,00000000,00000000,00000000 => 4亿亿亿 
 * 
 * @param {number} number 输入数字. 
 * @param {number} decimalDigit 小数点后最多位数，默认为2 
 * @return {string} 加上单位后的数字 
 */ 

 function addChineseUnit(number, decimalDigit) {
    decimalDigit = decimalDigit == null ? 2 : decimalDigit 
    var integer = Math.floor(number) 
    var digit = getDigit(integer) 
    // ['个', '十', '百', '千', '万', '十万', '百万', '千万']; 
    var unit = [] 
    if (digit > 3) { 
        var multiple = Math.floor(digit / 8) 
        if (multiple >= 1) { 
            var tmp = Math.round(integer / Math.pow(10, 8 * multiple)) 
            unit.push(addWan(tmp, number, 8 * multiple, decimalDigit)) 
            for (var i = 0; i < multiple; i++) { 
                unit.push('亿') 
            } 
            return unit.join('') 
        } else { 
            return addWan(integer, number, 0, decimalDigit) 
        } 
    } else { 
        return number 
    } 
}
function addWan(integer, number, mutiple, decimalDigit) {
    var digit = getDigit(integer) 
    if (digit > 3) { 
        var remainder = digit % 8 
        if (remainder >= 5) { // ‘十万’、‘百万’、‘千万’显示为‘万’ 
            remainder = 4 
        } 
        return Math.round(number / Math.pow(10, remainder + mutiple - decimalDigit)) / Math.pow(10, decimalDigit) + '万' 
    } else { 
        return Math.round(number / Math.pow(10, mutiple - decimalDigit)) / Math.pow(10, decimalDigit) 
    } 
}
function getDigit(integer) { 
    var digit = -1 
    while (integer >= 1) { 
        digit++ 
        integer = integer / 10 
    } 
    return digit 
}

// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}look(){console.log('authorization')}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
