import React from 'react';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import annotateImage from './Help/annotate_plugin.png';
import atlasImage from './Help/atlas_plugin.png';
import searchImage from './Help/search_plugin.png';

const useStyles = makeStyles({
  root: {
    margin: '1em',
    flexGrow: 1,
    fontSize: '14',
  },
});

export default function Help() {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Grid container spacing={3} justify="center">
        <Grid item sm={8}>
          <Typography variant="h2">Help</Typography>
        </Grid>
        <Grid item sm={4}>
          <Typography variant="h6">
            v{process.env.REACT_APP_VERSION} - {process.env.NODE_ENV}
          </Typography>
        </Grid>
        <Grid item md={10}>
          <Typography variant="h3" gutterBottom>
            Clio: A platform for discovery in large image volumes
          </Typography>
          <Typography variant="body1" paragraph>
            The following provides documentation on the goals of Clio and how to use it.
          </Typography>
          <Typography variant="h3" gutterBottom>
            Motivation
          </Typography>
          <Typography variant="body1" paragraph>
            Advances in volumetric electron microscopy (EM) in biology enables unprecedented insight
            in nanometer-resolution cellular phenomena, such as organelle arrangements or synaptic
            connectivity between neurons. However, analyzing EM data, often several terabytes in
            size, requires large-scale computational pipelines and teams of technicians and
            scientists to help mine the dataset. An example is the recent{' '}
            <a href="https://elifesciences.org/articles/57443">hemibrain connectome</a>, which
            required a large computational pipeline to align and segment the dataset into distinct
            neurons (using dataset-specific training data) and a team of annotators to evaluate the
            data. One drawback of these platforms is that it takes a lot of training data and tuning
            of deep learning algorithms to start performing meaningful science. Consequently, the
            barrier of entry to work with EM can be an impediment to science and often constrain
            scientific hypotheses to be narrow in scope.
          </Typography>
          <Typography variant="body1" paragraph>
            The purpose of Clio is to provide an ecosystem to facilitate application-agnostic
            analysis and hypothesis generation in multi-terabyte image datasets. Since deploying
            state of the art machine learning strategies to a new dataset remains an active area of
            research, a key feature of Clio is to provide a set of goal-invariant tools that will
            facilitate general purpose analysis and collaboration. The Clio ecosystem includes UI
            tools to enable low-level exploration and annotation in the dataset.
          </Typography>
          <Typography variant="body1" paragraph>
            Clio does not aim to provide state-of-the-art algorithms for object classification and
            segmentation but it does provide tools that leverage them. As this ecosystem matures,
            the goal is to provide users the ability to perform interactive object prediction and
            reuse pre-trained classifiers to facilitate &quot;first pass&quot; analysis of the
            dataset. The motivation is that Clio can allow users to form initial hypotheses in the
            dataset and then follow those insights with more rigor. For users familiar with the EM
            connectomics and the <a href="https://neuprint.janelia.org">neuprint</a>
            ecosystem, Clio can be considered as a complementary, lower-level entry point into EM
            data.
          </Typography>
          <Typography variant="h3" gutterBottom>
            Clio web application
          </Typography>
          <Typography variant="body1" paragraph>
            The web interface is designed to enable users several ways to explore and make and share
            discoveries in EM data. At a high-level, there are a series of plugins for interacting
            with the data. Each plugin interacts with an embedded version of{' '}
            <a href="https://github.com/google/neuroglancer">neuroglancer</a>. (We maintain a fork
            of this repo, which we aim to keep close to the original branch.) The user can choose
            from a set of datasets depending on the permissions associated with the dataset. For
            each dataset, we create a private sandbox for each user to store custom annotations and,
            where relevant, edit (proofread) the segmentation in dataset. We also provide
            capabilities for users to contribute annotations to share with the broader community as
            detailed below.
          </Typography>
          <Typography variant="body1" paragraph>
            The following sections cover the three major plugins and how users can use{' '}
            <a href="http://napari.org">napari</a> with Clio for drawing and image processing.
            Information on how to programmatically access the REST API can be found in the{' '}
            <Link to="/api/docs">API documentation</Link>.
          </Typography>
          <Typography variant="h4" gutterBottom>
            Annotate
          </Typography>
          <Typography variant="body1" paragraph>
            This plugin allows users to add points, lines, or circles to annotate or otherwise
            measure phenomena in the dataset, along with allow segmentation edits when segmentation
            is available. The purpose of this plugin is to enable light-weight annotations on large
            datasets, even if there is not automatic labeling available. In many cases, this is very
            useful to organize initial surveys of the data and explore initial hypotheses.
          </Typography>
          <img src={annotateImage} alt="annotate screenshot" width="100%" />
          <Typography variant="body1" paragraph>
            As shown in the image above, we leverage neuroglancer for data browsing and provide the
            user a side panel for choosing between three types of annotations. The generic
            &apos;annotation&apos; tab allows users to add points, lines, and circles in a private
            sandbox that is stored in the cloud and searchable via the web interface. The second
            &apos;atlas&apos; tab is a special type of point annotation that represents a point with
            a required title and description that the user wishes to share with the rest of the
            community via the atlas plugin (see below). The annotation is initially private until an
            admin from the dataset reviews and approves the annotation. The final tab is relevant
            when there is segmentation and allows users to merge segments in the dataset. The
            merging is only done in the user&apos;s private sandbox. However, there is the option
            for a user to submit merge decisions as a &apos;pull request&apos; so that the data can
            be reviewed, credited, and incorporated globally. As a convenience, we build some
            support to browse connectivity data via neuprint if the service is available.
          </Typography>
          <Typography variant="body1" paragraph>
            In future work, we will provide UI for associating label data (such as region
            information and segmentation labels or arbitrary manual drawings, see Napari section
            below) with annotations to improve data mining and search capabilities.
          </Typography>
          <Typography variant="h4" gutterBottom>
            Atlas
          </Typography>
          <Typography variant="body1" paragraph>
            The atlas plugin provides a community forum for sharing and viewing parts of the dataset
            that people find interesting. For instance, it might be used to highlight a strangely
            shaped membrane, an organelle, or imaging artifacts. The UI, shown below, shows 2D
            snapshots of each annotation. By clicking on one of these 2D snapshots, the user
            navigates to that location in the dataset. The UI also enables filtering based on
            dataset and keyword. The user is able to see his unverified atlas annotations, as well
            as, global, verified annotations.{' '}
          </Typography>
          <img src={atlasImage} alt="atlas screenshot" width="100%" />
          <Typography variant="h4" gutterBottom>
            Search
          </Typography>
          <Typography variant="body1" paragraph>
            In the absence of cell segmentation or other supervised data mining, it is often hard to
            navigate a very large dataset and find interesting motifs. We designed an unsupervised
            deep learning strategy that encodes small patches of image data with a smaller 64-bit
            signature to facilitate fast image searching. More information about the algorithm can
            be found in this <a href="https://arxiv.org/abs/2012.12175">arXiv submission</a>.
          </Typography>
          <img src={searchImage} alt="search screenshot" width="100%" />
          <Typography variant="body1" paragraph>
            The UI allows a user to click on a part of the image and then the algorithm will provide
            several matches of images that look similar (see picture above). The algorithm can
            quickly mine billions of image signatures in around one second by using a combination of
            hashing tricks and fast bitwise arithmetic within Google&apos;s BigQuery cloud service.
            This tool can be used to try to find multiple examples of a given phenomenon. Future
            research aims 1) to enable some light-weight object prediction based on real-time,
            interactive training 2) to combine predicted objects with other layers of image
            segmentation for data mining and 3D visualization, 3) and to provide programmatic API
            to do more complex analyses. Searches can be saved locally.
          </Typography>
          <Typography variant="h4" gutterBottom>
            Napari (TBD)
          </Typography>
          <Typography variant="body1" paragraph>
            Clio builds some support for importing and exporting data between Clio and Napari. We
            allow users in the annotation plugin to create a script for a given view of the data to
            enable users to download data from Clio into a format that can be viewed in napari. We
            also enable users to take custom labels and import the data as a channel viewable in
            neuroglancer as a user-specific, custom channel.
          </Typography>
          <Typography variant="body1" paragraph>
            Use Instructions...
          </Typography>
          <Typography variant="h4" gutterBottom>
            Future Directions
          </Typography>
          <Typography variant="body1" paragraph>
            As noted before, we aim to support more interactive tools for deploying light-weight
            segmentation and object prediction workflows, along with improving our data models for
            mining and viewing this data. Note: Clio should be able to work with data processed with
            other algorithms. We also plan to support more sophisticated segmentation editing
            (proofreading) capabilities (ideally reusing existing proofreading clients) and link to
            analysis tools like neuprint.
          </Typography>
        </Grid>
      </Grid>
    </div>
  );
}
