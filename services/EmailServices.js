"use strict";

const postgreConnection = require("../apps/helpers/sequelizeHelper");

const moment = require("moment");
const { writeLog } = require("../apps/helpers/utils");
const { axios } = require("axios");

module.exports = class EmailService {
  static async EmailRequest(objUser) {
    let objResponse ={};
    let pobj;
    objResponse.GetStatus = false;
    try {
        let userDetails = await EmailService.verifyUser(objUser.UserName);
        if (userDetails != "" && userDetails.length > 0){
            let UserId = userDetails[0]["registrationid"];
            let UserEmail = userDetails[0]["emailid"];
            let MobileNo = userDetails[0]["mobileno"];

            writeLog("EmailRquest : UserId UserEmail MobileNo " + UserId + " " + UserEmail + " " + MobileNo);

            let OTPCode = await EmailService.GenerateOTPCode(OTPCode);

            let config_type = "ForgetPassword";
            let ReplaceOTP = "@@Forget_OTP";
            if (objUser.Request_Type == 2)
            {
                config_type = "ChangePassword";
                ReplaceOTP = "@@Change_OTP";
            }
            
            let sender = `SELECT * FROM tbl_comn_communication_configuration WHERE lower(config_type) = ${config_type} AND isactive=TRUE;`;
            let senderResult = postgreConnection.query(sender);
            if (senderResult != null && senderResult.length > 0)
            {
                let AlertMailSubject = EmailService.GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Alert Mail Subject", "config_value", -1);
                let AlertMailBody = EmailService.GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Alert Mail Body HTML", "config_value", -1);
                let MailFormat = AlertMailBody.Replace(ReplaceOTP, OTPCode);
                
                objResponse.GetStatus = await EmailService.SaveOTP(OTPCode, UserId, objUser.Request_Type, objUser.Devicetype, objUser.AppName);
                if(objResponse.GetStatus){
                    let msg = "";
                    if(UserEmail != ""){
                        try {
                            await EmailService.SendEmail(OTPCode, UserEmail, MailFormat, AlertMailSubject);
                            writeLog("EmailRquest = Mail Sent");
                        } catch (err) {
                            objResponse.GetStatus = false;
                            objResponse.GetMessage = "The SMTP server is not set up and we cannot process that request.";
                            writeLog("EmailRquest = " + objResponse.GetMessage);
                            return objResponse;
                        }
                        msg = "Email"
                    }
                    let SmsResult = "";
                    let IsException = false;
                    if (objUser.AppName == "") {
                        objUser.AppName = "retail eazy";
                    }
                    writeLog(`EmailRquest = SMS Start OTPCode=${OTPCode}  MobileNo = ${MobileNo} AppName = ${objUser.AppName.toLower()}  Configtype = ${config_type}`);
                    EmailService.SendSMS("TEXTLOCAL", OTPCode, MobileNo, 0, objUser.AppName.toLower(), config_type, IsException, SmsResult);
                    // SendOTPMobile(OTPCode, MobileNo);
                    objResponse.GetMessage = "OTP has been sent to your " + msg + "Mobile No.";
                } else{
                    objResponse.GetMessage = "OTP sending failed.";
                }
            }else{
                objResponse.GetMessage = "Confriguration not found.";
            }
        } else {
            objResponse.GetMessage = "Invalid credential.";
        }
    } catch (e) {
        objResponse.GetStaus = false;
        objResponse.GetMessage = "we cannot process that request.";
        throw e;
    }
    return objResponse;
  }
  static async ForgetPasswordRequest(objForgetPassword){
    try {
        const response = { getStatus: false, getMessage: '' };
        let id = 0;
        let squery = '';
        let expireTime = 0;

        const dtUser = await EmailService.verifyUser(objForgetPassword.userName);
        if (dtUser != "" && dtUser.length > 0) {
            squery = "SELECT config_value FROM tbl_comn_communication_configuration WHERE lower(config_type) = lower('ForgetPasswordExpireTime') AND is_visible = true";
            writeLog("---Check Expire time Query---", squery);

            let dt = await postgreConnection.query(squery);
            if (dt.length === 1) {
                expireTime = parseInt(dt[0].config_value);

                squery = `SELECT (EXTRACT(DAY from age(now(), createdon))*24*60)+(EXTRACT(HOUR from age(now(), createdon))*60)+(EXTRACT(MINUTE from age(now(), createdon))) as totalminute, * FROM tbl_userotp WHERE isused = FALSE and isexpired = FALSE AND otp_type = 1 AND userid = ${dtUser[0]["registrationid"]}`;
                writeLog(" ---User Verified Code and Time Query---", squery);

                dt = await postgreConnection.query(squery);
                if (dtlength === 1 && dt[0]["otp_code"].toString() === objForgetPassword.OTP.toString()) {
                    const totalMinute = parseInt(dt[0]["totalminute"]);

                    if (totalMinute <= expireTime && totalMinute >= 0) {
                        squery = `UPDATE tbl_registration SET loginuserpassword = '${objForgetPassword.newPassword}' WHERE registrationid = ${dtUser[0]["registrationid"]} RETURNING registrationid`;
                        const UserId = await postgreConnection.query(squery);

                        squery = `UPDATE tbl_userotp SET isused = true, devicetype = ${objForgetPassword.devicetype} WHERE isused = FALSE and isexpired = FALSE AND userid = ${dtUser[0]["registrationid"]} RETURNING id`;
                        response.getStatus = await postgreConnection.query(squery);

                        response.getMessage = "Your password has been changed successfully.";
                        response.getStatus = true;
                    } else {
                        response.getStatus = false;
                        response.getMessage = "Your OTP is expired!!!!.";
                    }
                } else {
                    response.getStatus = false;
                    response.getMessage = "Your OTP have not matched.";
                }
            }
        }
        return response;
    } catch (error) {
        throw error;
    }
  }
  static async verifyUser(userName){
    let sQuery = `SELECT * FROM tbl_registration WHERE isactive=TRUE AND (lower(emailid) = ${userName} or mobileno = ${userName} )`;
    let dt = await postgreConnection.query(sQuery);
    return dt;
  }
  static async GenerateOTPCode(OTPCode){
    writeLog("Start OTP Code Generat");
    try {
        let otp = "";
        var OtpDetails = `SELECT * FROM tbl_comn_communication_configuration WHERE lower(config_type) = lower('OTPFormat') AND is_visible = true`;
        var OtpResult = postgreConnection.query(OtpDetails);
        if (OtpResult != "")
        {
            let OTPLength = parseInt(GetColumnValueUsingColValueFromDt(OtpResult, "config_name", "OTP Number Of Digit", "config_value", -1));
            let OTPFormat = GetColumnValueUsingColValueFromDt(OtpResult, "config_name", "OTP Format", "config_value", -1);

            const characters = OTPFormat.split('');

            for (let i = 0; i < OTPLength; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                otp += characters[randomIndex];
            }
        }
        OTPCode = otp;
    } catch (error) {
        throw error;
    }
    writeLog("End VerifiedCode Generate = " + OTPCode);
    return OTPCode;
  }
  static async GetColumnValueUsingColValueFromDt(dt,colname,colvalue,returncolname, rowIndex=-1){
    let data = "";
    if (rowIndex === -1) {
        dt[0].forEach(element => {
            let dr = element[colname]
            let returnColname = element[returncolname]
            if(dr===colvalue){
                data = returnColname.toString();
                // break;
            }
        });
        
    } else {
        data = dt[rowIndex][colname].toString();
    }
    return data;
  }
  static async SaveOTP(OTP, UserId, otp_type, devicetype, appname){
    let status = false;
    let squery = `UPDATE tbl_userotp SET isexpired = true,devicetype= ${devicetype}   WHERE isused=FALSE and isexpired=FALSE AND userid = ${UserId} Returning id `;
    await postgreConnection.query(squery);

    var queryUserVerified = `insert into tbl_userotp (userid, otp_code,otp_type,devicetype,remark) VALUES(${UserId},${OTP},${otp_type},${devicetype},${appname}) returning id`;
    writeLog(`Verified Code resend Insert Query ${queryUserVerified}`);

    status = await postgreConnection.query(queryUserVerified);
    return status;
  }
  static async SendEmail(OTPCode, EmailId, AlertMailBodyHTML, AlertMailSubject){
    try {
        writeLog("Start Mail Send");

        var sender = `SELECT * FROM tbl_comn_communication_configuration WHERE lower(config_type) IN (lower('SMTP_SendPasswordAndOTP'))`;
        var senderResult = postgreConnection.query(sender);
        if (senderResult != null)
        {
            var SMTPPort = EmailService.GetColumnValueUsingColValueFromDt(senderResult, "config_name", "SMTP Port", "config_value", -1);
            var SMTPServer = EmailService.GetColumnValueUsingColValueFromDt(senderResult, "config_name", "SMTP Server", "config_value", -1);
            var SenderEmail = EmailService.GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Email ID", "config_value", -1);
            var SenderPassword = EmailService.GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Email ID Password", "config_value", -1);
            var IsNetworkCredential = EmailService.GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Is Network Credential", "config_value", -1);
            var EnableSSL = EmailService.GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Enable SSL", "config_value", -1);
            var HTMLFormat = EmailService.GetColumnValueUsingColValueFromDt(senderResult, "config_name", "HTML Format", "config_value", -1);

            let MailBody = AlertMailBodyHTML;
            let client = {};
            // SmtpClient client = new SmtpClient(SMTPServer, Convert.ToInt32(SMTPPort));
            client.UseDefaultCredentials = Boolean(IsNetworkCredential);
            client.Credentials = new System.Net.NetworkCredential(SenderEmail, SenderPassword);
            client.EnableSsl = Boolean(EnableSSL);
            client.DeliveryMethod = SmtpDeliveryMethod.Network;
            
            writeLog("Network Connection Done");
            const mailOptions = {
                from: SenderEmail,
                to: EmailId,
                subject: AlertMailSubject,
                text: HTMLFormat,
                html: MailBody
            };
            const transporter = nodemailer.createTransport({
                host: SMTPServer,
                port: SMTPPort,
                secure: Boolean(EnableSSL), // true for 465, false for other ports
                auth: {
                    user: SenderEmail,
                    pass: SenderPassword
                }
            });

            const info = await transporter.sendMail(mailOptions);
            writeLog("End Mail Send");
        }
    } catch (error) {
        writeLog("Send Mail Details Catch Section  " + error.Message.toString());
        throw ex;
    }
  }
  static async SendSMS(APIType, OTPode, ContactNo, brandid, appname, config_type, IsSmsException, SmsResult){
    IsSmsException = false;
    SmsResult = "";
    if (OTPode != "" && ContactNo != "")
    {
        if (APIType == "TEXTLOCAL")
        {
            EmailService.SendSMSTextLocalAPI(OTPode, ContactNo, brandid, appname, config_type, IsSmsException, SmsResult);
        }
        if (APIType == "NETCORE")
        {
            EmailService.SendSMSNetCore(OTPode, ContactNo, brandid, appname, IsSmsException, SmsResult);
        }
    }
  }
  static async SendSMSNetCore(OTP, MobileNo, brandid, appname, IsException, SmsResult){
    IsException = false;
    SmsResult = "";
    try {
        let GetSMSQuery = `SELECT * FROM tbl_comn_communication_configuration WHERE lower(appname)='" + appname.ToLower() + "' and brandid=" + brandid + " and lower(config_type) IN (lower('MobileOTP_NETCORE'))`;
        writeLog("SendLogInOTPMobile Get SMS Details Query " + GetSMSQuery.toString());
        let senderResult = postgreConnection.query(GetSMSQuery.toString());

        let MinuteValidity = postgreConnection.query("Select value from tbl_globalsettings Where lower(itemkeyname) = lower('LogIn_OTP_Validity_Minute') ");
        if(senderResult != ""){
            let MainURL = "http://bulkpush.textsms.co.in/app/smsapi/index.php?";
            let APIKey = "key=" + GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Key", "config_value", -1);
            let Entity = "&entity=" + GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Entity", "config_value", -1);
            let RouteID = "&routeid=" + GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Routeid", "config_value", -1);
            let Type = "&type=text";
            let ContactNo = "&contacts=" + MobileNo;
            let SenderID = "&senderid=" + GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Senderid", "config_value", -1);
            let Message = GetColumnValueUsingColValueFromDt(senderResult, "config_name", "Message", "config_value", -1);

            Message = Message.Replace("OTP", OTP);
            Message = Message.Replace("minute", MinuteValidity);
            Message = Message.Replace("appname", appname);

            let URL = MainURL + APIKey + Entity + RouteID + Type + ContactNo + SenderID + Message;
            const headers = {
                "Content-Type": "application/x-www-form-urlencoded",
              };
            await axios.post(URL,{
                headers:headers
            });

        }

    } catch (e) {
        
    }
  }
  static async SendSMSTextLocalAPI(){

  }
}