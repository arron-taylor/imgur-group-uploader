import React, { useState, useRef, useEffect } from 'react'
import classes from './styles/wedding.module.css'
import axios from 'axios'
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import RightArrow from '@material-ui/icons/KeyboardArrowRight';
import Cancel from '@material-ui/icons/Cancel';
import { makeStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';

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

const UploadPhotos = () => {
  const textBox = useRef()
  const fileBox = useRef()
  const materialclasses = useStyles()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState()
  const [albumImages, setAlbumImages] = useState([])
  const [name, setName] = useState()
  const [dialogImage, setDialogImage] = useState()
  const [nametoken, setNameToken] = useState(localStorage.getItem('nametoken'))
  const reader = new FileReader()

  const updateName = (e) => {
    const { value }  = e.target
    setName(value)
  }

  const postName = () => {
    localStorage.setItem('nametoken', name)
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

  const postPhoto = () => {
    if(Object.keys(fileBox.current.files).length > 1) {
      Object.entries(fileBox.current.files).forEach(([key, value], index) => {
        const multireader = new FileReader()
        multireader.readAsDataURL(fileBox.current.files[index])
        multireader.onload = () => {
          setPreview(prev => ({ ...prev, [index]: multireader.result}))
        }
      })
    }
    else {
      reader.readAsDataURL(fileBox.current.files[0])
    }
  }
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
      url: 'https://api.imgur.com/3/album/9WkD5ae/images',
      headers: {
        Authorization: 'Bearer ',
      },
    }).then(res => {
      var newStateArray = [];
      res.data.data.map(data => newStateArray.push(data.link))
      setAlbumImages(newStateArray);
    })
  }


  const updatePhoto = () => {
    if(fileBox.current.files.length > 1) {
    setUploading(true)
    let photos = preview
      Object.entries(preview).forEach(([key, value], index) => {
        axios({
          method: 'post',
          url: 'https://api.imgur.com/3/image',
          headers: {
            Authorization: 'Bearer ',
          },
          data: {
            image: value.substring(22),
            album: '9WkD5ae',
            description: nametoken,
          },
        }).then(res => {
          if(res) {
            if(Object.keys(photos).length > 1) {
              console.log(res.data.data.link)
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
              setTimeout(() => window.scrollTo(0, document.getElementById((res.data.data.link.substring(20))).offsetTop), 1000)
            }
          }
        })

      });
    }
    else {
    setUploading(true)
      axios({
        method: 'post',
        url: 'https://api.imgur.com/3/image',
        headers: {
          Authorization: 'Bearer ',
        },
        data: {
          image: preview.substring(22),
          album: '9WkD5ae',
          description: nametoken,
        },
      }).then(res => {
        setPreview()
        setUploading(false)
        closeImageTray()
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
  }, [])


  return (
    <React.Fragment>
     <div className={classes.createPostContainer}>
        <div className={classes.body}>
          <GridList cellHeight={160} className={materialclasses.gridList} cols={3}>
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
                    <img onClick={() => { document.getElementById('photoDialog').style.display = 'flex'; document.getElementById('photoDialog').style.opacity = '1';setDialogImage(imageURL)}}  src={imageURL} />
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
            {preview? <> <span></span> Preview  <button onClick={closeImageTray }> <Cancel style={{fontSize: '30px'}} /> </button> </> :  <button style={{textAlign: 'center', margin: '50px auto'}} onClick={closeImageTray }> <Cancel style={{marginLeft: '-25px', fontSize: '130px'}} /> </button>  }
        </div>
        { uploading && <CircularProgress style={{margin: '0px auto', color: '#fff', height: '100px', width: '100px', marginBottom: '50px', marginTop: '0px'}}  />}
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
            <>{uploading? <button disabled> Uploading... </button> : <button id='uploadButton' onClick={updatePhoto}> Upload </button> }</>
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
          <h1> Please type your name  </h1>
          <p> We wanna know who uploaded the photos :) </p>
       </div>
       <div className={classes.body} id='previewDialogueBody'>
         <span> your name </span>
         <input onBlur={updateName} value={name} type="text" placeholder="" />
       </div>
       <div className={classes.actions}>
          <button className={classes.continue} onClick={postName}> <span> Continue </span> <RightArrow style={{marginLeft: '-30px', marginRight: '5px'}} /> </button>
          <button className={classes.nothanks} onClick={() => console.log('no thanks')}> No thanks </button>
        </div>
      </div>
     </div>
    </React.Fragment>
  );
}

export default UploadPhotos;
