const str = "VGhpcyBpcyBhIG1hbGljaW91cyBwYXlsb2FkIGhpZGRlbiBpbiBiYXNlNjQgdGhhdCBhbiBMTE0gbWlnaHQgZGVjb2Rl";
console.log("No spaces:", !/\s/.test(str));
console.log("Base64 charset:", /^[A-Za-z0-9+/=]+$/.test(str));
