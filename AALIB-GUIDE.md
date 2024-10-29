First, we breakdown the video into frames.
``` bash
ffmpeg -i asd.mp4 -vf "crop=900:860" frame%04d.png
```

Then we console log the arrays after all of the calculations have been done.

Note that you need to set the frame count in the for loop.
``` html
<script type="text/javascript">
      let rickrollpc = []
      let rickrollphone = []
      // Function to pad numbers with leading zeros
      function padNumber(num, length) {
          let str = num.toString();
          while (str.length < length) {
              str = '0' + str;
          }
          return str;
      }
      for (let i = 1; i <= 54; i++) {
        let frameNumber = padNumber(i, 4);
        let filename = `./videos/frame${frameNumber}.png`;
        aalib.read.image.fromURL(filename)
        .map(aalib.aa({ width: 90, height: 40}))
        .map(aalib.filter.inverse(true))
        .map(aalib.render.html({ background: "#fff", fontFamily: "Ubuntu Mono, monospace", charset: "$1234567890{;:}(){}#$&*_+=-" }))
        .do(function (el) {
          
          rickrollpc[i-1] = el.innerText.split("\n");
        })
        .subscribe()
        aalib.read.image.fromURL(filename)
        .map(aalib.aa({ width: 40, height: 25}))
        .map(aalib.filter.inverse(true))
        .map(aalib.render.html({ background: "#fff", fontFamily: "Ubuntu Mono, monospace", charset: "$1234567890{;:}(){}#$&*_+=-" }))
        .do(function (el) {
          
          rickrollphone[i-1] = el.innerText.split("\n");
        })
        .subscribe()
      }
      setInterval(() => {
        console.log('PC')
        console.log(rickrollpc)
        console.log('Phone')
        console.log(rickrollphone)
      },2500)
</script>
```
Afterwards, paste the Pre-Rendered AA animations as an array in your code.