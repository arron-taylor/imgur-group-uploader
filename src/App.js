import React, { useState, useRef, useEffect } from 'react'
import classes from './styles/wedding.module.css'
import axios from 'axios'
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import RightArrow from '@material-ui/icons/KeyboardArrowRight';
import Cancel from '@material-ui/icons/Cancel';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useScrollPosition } from '@n8tb1t/use-scroll-position'
import ReactGA from 'react-ga'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import ImageBlobReduce from 'image-blob-reduce'
import Pica from 'pica'

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
  },
  gridList: {
    width: '100%',
    '& div': {
      borderRadius: '3px'
    }
  },
}));

const pica = Pica()
const reduce = new ImageBlobReduce({ pica })

const UploadPhotos = () => {
  const fileBox = useRef()
  const materialclasses = useStyles()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSize, setUploadSize] = useState(0)
  const [uploadPrompt, setUploadPrompt] = useState(false)
  const totalFiles = []
  const [preview, setPreview] = useState()
  const [albumImages, setAlbumImages] = useState([])
  const [wholeAlbumArray, setWholeAlbumArray] = useState()
  const [name, setName] = useState()
  const [dialogImage, setDialogImage] = useState()
  const [nametoken, setNameToken] = useState(localStorage.getItem('nametoken'))
  const reader = new FileReader()
  const multireader = new FileReader()
  const isDesktop = useMediaQuery('(min-width:1024px)')

  const updateName = (e) => {
    const { value }  = e.target
    setName(value)
  }

  const postName = () => {
    localStorage.setItem('nametoken', name)
    setNameToken(name)
    document.getElementById('dialog').style.opacity = '0'
    setTimeout(() => {
      document.getElementById('dialog').style.display = 'none'
    }, 250)
  }

  const anonPoster = () => {
    localStorage.setItem('nametoken', 'anonymous poster')
    setNameToken('anonymous poster')
    document.getElementById('dialog').style.opacity = '0'
    setTimeout(() => {
      document.getElementById('dialog').style.display = 'none'
    }, 250)
  }

  const openImageTray = (e) => {
    document.getElementById('imageTray').style.display = 'flex'
    setTimeout(() => {
      document.getElementById('imageTray').style.opacity = '1'
      document.getElementById('imageTrayInner').style.transform = "translate(0px)"
      document.getElementById('uploadButton').style.display = 'block'
    }, 0)
  }

  const closeImageTray = () => {
    document.getElementById('imageTrayInner').style.transform = "translate(0px, -100vh)"
    document.getElementById('imageTray').style.opacity = '0'
    setTimeout(() => {
      document.getElementById('imageTray').style.display = 'none'
      document.getElementById('uploadButton').style.display = 'none'
      setPreview()
    }, 200)
  }

  const photoSuccessNotify = () => {
    setTimeout( () => {
      document.getElementById('successDialog').style.display = 'flex'
      setTimeout(() => {
        document.getElementById('successDialog').style.opacity = '1'
        document.getElementById('successDialogInner').style.transform = "translate(0px, -10px)"
      }, 0)
      setTimeout(() => {
        document.getElementById('successDialog').style.opacity = '0'
        document.getElementById('successDialogInner').style.transform = "translate(0px, -100vh)"
      }, 3000)
      setTimeout(() => {
        document.getElementById('successDialog').style.display = 'none'
      }, 3500)
    }, 100)
  }

  const sizeWarning = () => {
    setTimeout( () => {
      document.getElementById('sizeWarning').style.display = 'flex'
      setTimeout(() => {
        document.getElementById('sizeWarning').style.opacity = '1'
        document.getElementById('sizeWarningInner').style.transform = "translate(0px, 0px)"
      }, 0)
    }, 100)
  }

  const sizeWarningClose = () => {
    setTimeout(() => {
      document.getElementById('sizeWarning').style.opacity = '0'
      document.getElementById('sizeWarningInner').style.transform = "translate(0px, -100vh)"
    }, 0)
    setTimeout(() => {
      document.getElementById('sizeWarning').style.display = 'none'
    }, 250)
  }

  const postPhoto = async () => {
    let totalFileSize = 0

    if(Object.keys(fileBox.current.files).length > 1) {
      if(Object.keys(fileBox.current.files).length > 25) {
        sizeWarning()
      }
      for (var i=0; i<fileBox.current.files.length;i++) {
        const theBlob = await reduce.toBlob(fileBox.current.files[i], { max: 1000 })
        multireader.readAsDataURL(theBlob)

        totalFileSize += parseFloat( ((fileBox.current.files[i].size)/1024/1024) )
        setUploadSize( totalFileSize.toFixed(2) )
      }
    }
    else {
      const theBlob = await reduce.toBlob(fileBox.current.files[0], { max: 1000 })
      reader.readAsDataURL(theBlob)
    }
  }

  multireader.addEventListener('load', (...a) => {
    totalFiles.push(a)
    setPreview(prev => ({ ...prev, [totalFiles.length-1]: a[0].srcElement.result}))
  })

  reader.addEventListener("load", function () {
    if(fileBox.current.fileslength > 1){
    }
    else {
      setPreview(reader.result)
    }
  }, false)

  const getAlbumImages = async () => {
    axios({
      method: 'get',
      url: 'https://imgur-apiv3.p.rapidapi.com/3/album/' + process.env.REACT_APP_IMGUR_ALBUM + '/images',
      headers: {
        Authorization: process.env.REACT_APP_IMGUR_KEY,
        'x-rapidapi-key': process.env.REACT_APP_RAPID_API_KEY,
        'x-rapidapi-host': 'imgur-apiv3.p.rapidapi.com'
      },
    }).then(res => {
      var newStateArray = [];
      res.data.data.map(data => newStateArray.push(data.link))
      newStateArray.length === 0 && setUploadPrompt(true)
      var firstBatch = newStateArray.slice(0, 15)
      setWholeAlbumArray(newStateArray)
      setAlbumImages(firstBatch);
    })
  }

  useScrollPosition(({ currPos }) => {
    let pos = (currPos.y*-1)
    if(pos > (document.getElementById((albumImages[albumImages.length-1]).slice(-11)).offsetTop)-800) {
      infiniteScroll()
    }
  })

  const infiniteScroll = () => {
    if(albumImages.length < wholeAlbumArray.length){
      let newBatch = wholeAlbumArray.slice(albumImages.length, albumImages.length+15)
      setAlbumImages([...albumImages, ...newBatch])
    }
  }

  const updatePhoto = () => {
    if(fileBox.current.files.length > 1) {
    parseFloat(Object.keys(fileBox.current.files).length) > 25 && ReactGA.event({category: 'Clicks', action: 'Clicked upload after warning'});
    setUploading(true)
    let photos = preview
      Object.entries(preview).forEach(([key, value], index) => {
        axios({
          method: 'post',
          url: process.env.REACT_APP_IMAGE_UPLOAD_URL,
          headers: {
            Authorization: process.env.REACT_APP_IMGUR_KEY,
            'x-rapidapi-key': process.env.REACT_APP_RAPID_API_KEY,
            'x-rapidapi-host': 'imgur-apiv3.p.rapidapi.com'
          },
          data: {
            image: value.substring(22),
            album: process.env.REACT_APP_IMGUR_ALBUM,
            title: nametoken,
          },
          onUploadProgress: (data) => {
            setUploadProgress(Math.round((100 * data.loaded) / data.total))
          }
        }).then(res => {
          if(res) {
            if(Object.keys(photos).length > 1) {
              setUploadProgress(0)
              document.getElementById(index).style.opacity = 0
              setTimeout(() => {
                delete photos[index]
                setPreview(prev => ({ ...prev, [index]: undefined}))
              }, 250)
            }
            else {
              setPreview()
              setUploading(false)
              closeImageTray()
              setAlbumImages([])
              getAlbumImages()
              setTimeout(() => {
                if( document.getElementById(res.data.data.link.substring(20))) {
                  window.scrollTo(0, document.getElementById(res.data.data.link.substring(20)).offsetTop)
                }
              }, 1000)
              photoSuccessNotify()
            }
          }
          else {
            console.log('error uploading!')
          }
        })

      });
    }
    else {
    setUploading(true)
      axios({
        method: 'post',
        url: process.env.REACT_APP_IMAGE_UPLOAD_URL,
        headers: {
          Authorization: process.env.REACT_APP_IMGUR_KEY,
          'x-rapidapi-key': process.env.REACT_APP_RAPID_API_KEY,
          'x-rapidapi-host': 'imgur-apiv3.p.rapidapi.com'
        },
        data: {
          image: preview.substring(22),
          album: process.env.REACT_APP_IMGUR_ALBUM,
          title: nametoken,
        },
        onUploadProgress: (data) => setUploadProgress(Math.round((100 * data.loaded) / data.total))
      }).then(res => {
        setPreview()
        setUploading(false)
        closeImageTray()
        photoSuccessNotify()
      })
    }
  }

  useEffect(() => {
    if(!nametoken) {
      document.getElementById('dialog').style.display = 'flex'
      setTimeout(() => {
        document.getElementById('dialog').style.opacity = '1'
      }, 250)
    }
    getAlbumImages()
    ReactGA.initialize(process.env.REACT_APP_GA_ID)
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])

  return (
    <>
      {uploadPrompt &&
        <div className={classes.successDialog} id="successDialog" style={{display: 'flex', opacity: 1}}>
          <div className={classes.inner} id="successDialogInner" style={{marginTop: '110vh'}}>
            <div className={classes.title}>
              <h1 style={{fontSize: '22px', maxWidth: '80%', textAlign: 'center', margin: '20px auto'}}> No photos have been uploaded yet.	</h1>
              <p style={{ maxWidth: '80%', textAlign: 'center', margin: '20px auto'}}>You can be the first. Click the button below &#128071;</p>
            </div>
          </div>
        </div>
      }
     <div className={classes.createPostContainer}>
        <div className={classes.body}>
          <GridList cellHeight={isDesktop? 360 : 160} className={materialclasses.gridList} cols={3}>
            { albumImages && albumImages.length > 0 &&
              albumImages.map( (imageURL, index) => {
                let theIndex
                if((index.toString().slice(-1)) == 1 || ( index.toString().slice(-1)) == 5){
                  theIndex = 2
                }
                else {
                  theIndex = 1
                }
                return (
                <GridListTile id={imageURL.substring(20)} key={index} cols={theIndex} >
                  <img style={{cursor: 'pointer'}} onClick={() => { document.getElementById('photoDialog').style.display = 'flex'; document.getElementById('photoDialog').style.opacity = '1';document.getElementById('photoDialog').style.zIndex = '999';setDialogImage(imageURL)}} src={imageURL.substring(0, imageURL.length-4) + (isDesktop? 'l.' : 'm.') + imageURL.substring(imageURL.length-3)} />
                </GridListTile>
                )
              })
            }
          </GridList>
        </div>
				<div className={classes.actions}>
          <button className={classes.uploadButton} onClick={openImageTray}> Upload </button>
        </div>
     </div>
     <div className={classes.imageTray} id='imageTray'>
      <div className={classes.inner} id="imageTrayInner">
        <div className={classes.title}>
          {preview? <> <span> Preview </span> <button onClick={closeImageTray}> <Cancel style={{fontSize: '40px', color: '#555'}} /> </button> </> :  <button style={{textAlign: 'center', margin: '50px auto'}} onClick={closeImageTray }> <Cancel style={{marginLeft: '-10px', fontSize: '100px', color: "#555"}} /> </button>  }
        </div>
        { uploading &&
          <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            <CircularProgress style={{color: '#fff', height: '100px', width: '100px', marginTop: '0px'}} />
            <span style={{color: '#fff', fontSize: '25px', position: 'absolute'}}> {uploadProgress}% </span>
          </div>
        }
        <div className={classes.body} id='imageTrayBody'>
          {preview? <>
            {fileBox.current.files.length > 1?
              Object.values(preview).map(function(value, index) {
                if(value == undefined) {
                  return
                }
                else {
                  return <img id={index} key={index} src={value} />
                }
              })
            :
            <img src={preview} />}
          </> : null
          }
        </div>
        <div className={classes.actions}>
          {preview?
            <>{uploading? <button disabled> Uploading... </button> : <button id='uploadButton' onClick={updatePhoto}> Upload {fileBox.current.files.length} Photos </button> }</>
            :
            <>
              <button id='uploadButton' className={classes.chooseButton} onClick={() => fileBox.current.click()}> Choose Photos </button>
            </>
          }
          <input multiple='multiple' style={{display: 'none'}} ref={fileBox} type="file" onChange={postPhoto} />
        </div>
      </div>
     </div>
     <div className={classes.photoDialog} id='photoDialog'>
      <div className={classes.inner}>
        <button onClick={() => { document.getElementById('photoDialog').style.display = 'none'; document.getElementById('photoDialog').style.opacity = '0';setDialogImage()}}> <Cancel style={{fontSize: '48px'}} /> </button>
        <div className={classes.body} id='previewDialogueBody'>
          <img src={dialogImage} />
       </div>
      </div>
     </div>

     <div className={classes.previewDialogue} id='dialog'>
      <div className={classes.inner}>
       <div className={classes.title}>
          <h1>Type your name  </h1>
          <span><h2>&</h2> <p> Help us remember what photos you uploaded &#128522;	 </p></span>
       </div>
       <div className={classes.body} id='previewDialogueBody'>
         <input onBlur={updateName} value={name} type="text" placeholder="Your name" />
       </div>
       <div className={classes.actions}>
          <button className={classes.continue} onClick={() => { postName(); }}> <span> Continue </span> <RightArrow style={{marginLeft: '-30px', marginRight: '5px'}} /> </button>
          <button className={classes.nothanks} onClick={() => { anonPoster(); ReactGA.event({category: 'Clicks', action: 'Clicked no thanks button'});}}> No thanks </button>
        </div>
        <div className={classes.names}>
          <h3>
            Wife
          </h3>
          <h4>
            AND
          </h4>
          <h3>
            Husband
          </h3>
        </div>
      </div>
     </div>

      {nametoken &&
      <div className={classes.desktopBar} >
        <div className={classes.inner}>
          <div className={classes.title}>
            <h1> Celebrating  </h1>
            <div className={classes.names}>
              <h3>
                Wife
              </h3>
              <h4>
                AND
              </h4>
              <h3>
                Husband
              </h3>
            </div>
              <h1> July 17, 2021  </h1>
          </div>
          <div className={classes.body}>
            <button className={classes.uploadButton} onClick={openImageTray}> Upload Photos </button>
          </div>
        </div>
      </div>}

      <div className={classes.successDialog} id="successDialog" >
        <div className={classes.inner} id="successDialogInner" >
          <div className={classes.title}>
            <p>Woohoo! Success!</p>
            <h1> Thanks for uploading &#10084;&#65039;	</h1>
          </div>
        </div>
      </div>

      <div className={classes.sizeWarning} id="sizeWarning" >
        <div className={classes.inner} id="sizeWarningInner">
          <div className={classes.title}>
            <h1 style={{marginTop:'20px'}}>That's a lot of data you got there...</h1>
          </div>
          <div className={classes.body} id='sizeWarningBody'>
            <span>
            Without good signal strength this may take a couple minutes to upload.
            </span>
            <p> Consider uploading on WiFi </p>
          </div>
          <div className={classes.actions}>
            <button className={classes.nothanks} onClick={sizeWarningClose}> OK </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default UploadPhotos;
