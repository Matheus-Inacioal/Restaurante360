const fs = require('fs');
const envPath = '.env.local';

let content = '';
if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
}

// Remove previously added admin keys if they exist to avoid duplication
content = content.replace(/^FIREBASE_PROJECT_ID=.*$/gm, '');
content = content.replace(/^FIREBASE_CLIENT_EMAIL=.*$/gm, '');
content = content.replace(/^FIREBASE_PRIVATE_KEY=.*$/gm, '');

// Clean up multiple empty lines
content = content.replace(/\n\s*\n/g, '\n');

// Append new
content += `\nFIREBASE_PROJECT_ID="restaurante360-17ba9"`;
content += `\nFIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@restaurante360-17ba9.iam.gserviceaccount.com"`;
content += `\nFIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDFeZveiSCoS1XD\\npEwDdc7AMKk0xsAVUk+tMIE+hahUSHAXzKzpJoRKM6q6IzL7ddlcgnzZq0XJX55X\\nkF+bvs3jQordq545qvZYR67wsRxB9b2JEs/znfaIUCVqgpg0jQiKix/GOZP1TkIg\\np9gZ8kSd/t+SgXGZyQ3o4qsUaLQXMAN4zmX2ghEbzl4Nak7kbpgTHkE5ToiBtFhM\\nABYRPdRb6dGIwfUQVinG/3h/OhrNop+/b0QgHWUXoQqZ5MPn/M6GFTH+M03FevEV\\nc/rwYDLycAsg13fPjD+UqLbX2FBn/tzoBOu8tBwO1oF8FSQleBImcDQ/c1dO1rdQ\\ni4afNldDAgMBAAECggEACsmF1jYvboIPAUzsShQZYy5FT/i7bW69o3xO0xeCBnie\\nhu5LU8Ei4NrJrLlXg50AbqlCILHWchWjFK1yS5O0s4FjDJDfZ88K/e+MguFp5cCC\\nxgYdDfXHDdMy+AqCPfymRssqxS1IA9JuklIY3/H4BZlypRIlHn15IQugxNCjZdDF\\nDw2GSwd6xIvviN3C9VATuuSeylWwlJzCCBudhU4UV5TID1iisnjzM2i1jBDEYstk\\natjcMN4GrOv7rUra0cNXhqr2Iw6Wle2qe0kW5fA/v4Cw+1/cbkPCtClEMwXLCnxr\\ngwrTE4cPuUzJRLun5cch3QNoK9eVdSwl5GVi2pwqgQKBgQDio/MY/AJzIR5pzPXY\\n/TqVPV3xzraLZxl/CfKrnsD6drYtcT0dVdCtIvZtglcYr/C3YyrpvdASbgjlUvlJ\\nA3SLOvukF04WI4NbxZ1BPsYkMrHCOFsRc+akNRSJlw3X4rwXXjznJJMdXZWqKBK1\\nD6zyPfRDS7mo+2iHSiQ/N1o3swKBgQDfDnNf0S7TwG3f4tRLWa+Aw2uGH55b5wXs\\nEwZvPnVL52jebv7VN9RP/m2oiXMjCovr6zFB8pcm+X5cGrCMlSV9NuZL+EqkSdnO\\nc1ZtGzWKDBU0TxyXsJXOSvyNoC8By/Mch+XmZH1v75J2ikou6T3ZiJJ0AlSeQQJr\\neygegNCaMQKBgQCodMQUJfyMJmm8qiNyDYaltt9FBCiapR9GVdaRyYYWpHX0gN60\\nFzzr87jG3MJwDxYUuRkEc5lcmXzzNyEjK/ZMJqMz7D6WJf9VDyU7gbU04plNiyXl\\nawhbtTh2rFgVxumXVOxfwce3ZAACYZbGDci2pWYRPw/YkkW3iVw3wKTGEQKBgA0P\\nLogUmjZBlO0/vYgv1wul5Vyz6zScQQeCUaUftgRcpxIm03quSxrn3Ym5imkpy+lj\\nGr4ustTQVKqV0XJZpRlAppkaD1yxCjSBIjU/G5JahL9MRnNHHm42i7TLBRWI2FH6\\nTuZ/SazNDPktvYwjkcBzs4dhP40IZ1jdnAq1JgFxAoGBANiGi02CMWerCYNnY78X\\nbIqioFie6GWtHPEkKUeNRmK5MxgBtdb1sKHX987YlyKO2GY+mGlHF3f7jG1WjS4Y\\n7v92iZrFn6JrNJkzmpLTyw++a4mHp9mTCEp+ulwOwJvHOW/G9viebvyYb0xLdlY3\\nIdQanBgdKPE+4DpzdFEUscsq\\n-----END PRIVATE KEY-----\\n"`;
// Add newline at the end if missing
if (!content.endsWith('\n')) content += '\n';

fs.writeFileSync(envPath, content);
console.log(".env.local updated successfully");
