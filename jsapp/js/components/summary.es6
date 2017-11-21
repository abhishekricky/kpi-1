import React from 'react';
import ReactDOM from 'react-dom';
import reactMixin from 'react-mixin';
import autoBind from 'react-autobind';
import Reflux from 'reflux';
import {dataInterface} from '../dataInterface';
import bem from '../bem';

import DocumentTitle from 'react-document-title';
import moment from 'moment';
import Chart from 'chart.js';

import {
  assign, t, formatTime,
} from '../utils';


class Summary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      graphWidth: "700",
      graphHeight: "250",
      subsThisWeek: 0,
      subsLastWeek: 0,
      lastSubmission: false,
      submissionsChart: false
    };
    autoBind(this);
  }
  componentDidMount() {
    this.getLatestSubmissionTime();
    this.prepSubmissions();
  }
  prepSubmissions() {
    const thisWeekStart = moment().startOf('week');
    const query = `query={"_submission_time": {"$gte":"${thisWeekStart.toISOString()}"}}&fields=["_id","_submission_time"]`;
    dataInterface.getSubmissionsQuery(this.props.asset.uid, query).done((thisWeekSubs) => {
      var subsThisWeek = thisWeekSubs.length;
      const lastWeekStart = thisWeekStart.subtract(7, 'days');
      if (subsThisWeek)
        this.setState({submissionsChart: true});

      const q2 = `query={"_submission_time": {"$gte":"${lastWeekStart.toISOString()}"}}&fields=["_id"]`;
      dataInterface.getSubmissionsQuery(this.props.asset.uid, q2).done((d) => {
        if (subsThisWeek > 0) {
          var subsPerDay = [0,0,0,0,0,0,0];
          thisWeekSubs.forEach(function(s, i){
            var subDayofWeek = moment(s._submission_time).format('d');
            subsPerDay[subDayofWeek] += 1;
          });

          Chart.defaults.global.elements.rectangle.backgroundColor = 'rgba(61, 194, 212, 0.6)';
          var opts = {
            type: 'bar',
            data: {
                labels: [
                    thisWeekStart.format('ddd DD MMM'), 
                    thisWeekStart.add(1, 'days').format('ddd DD MMM'), 
                    thisWeekStart.add(2, 'days').format('ddd DD MMM'), 
                    thisWeekStart.add(3, 'days').format('ddd DD MMM'), 
                    thisWeekStart.add(4, 'days').format('ddd DD MMM'), 
                    thisWeekStart.add(5, 'days').format('ddd DD MMM'), 
                    thisWeekStart.add(6, 'days').format('ddd DD MMM'), 
                  ],
                datasets: [{
                  data: subsPerDay,
                }]
            },
            options: {
              legend: {
                display: false
              },
              scales: {
                yAxes: [{
                  ticks: {
                    beginAtZero: true,
                    userCallback: function(label, index, labels) {
                      if (Math.floor(label) === label) {return label;}
                    },
                  }
                }],
              },
            }
          };

          const canvas = ReactDOM.findDOMNode(this.refs.canvas);
          var submissionsChart = new Chart(canvas, opts);
        }

        this.setState({
          subsLastWeek: d.length - subsThisWeek,
          submissionsChart: submissionsChart || false,
          subsThisWeek: subsThisWeek
        });
      });
    });

  } 
  getLatestSubmissionTime() {
    const fq = ['_id', '_submission_time'];
    const sort = [{id: '_id', desc: true}];
    dataInterface.getSubmissions(this.props.asset.uid, 1, 0, sort, fq).done((data) => {
      this.setState({lastSubmission: data[0]['_submission_time']});
    });
  }
  renderSubmissionsGraph() {
    return (
      <bem.FormView__row>
        <bem.FormView__cell m='label'>
          {t('Submissions')}
        </bem.FormView__cell>
        <bem.FormView__cell m={['box']}>
          {this.state.submissionsChart &&
            <bem.FormView__cell m='subs-graph'>
              <canvas ref="canvas" />
            </bem.FormView__cell>
          }
          <bem.FormView__group m={['submission-stats']}>
            <bem.FormView__cell>
              <span className="subs-graph-number">{this.state.subsThisWeek}</span>
              <bem.FormView__label>{t('This Week')}</bem.FormView__label>
            </bem.FormView__cell>
            <bem.FormView__cell>
              <span className="subs-graph-number">{this.state.subsLastWeek}</span>
              <bem.FormView__label>{t('Last week')}</bem.FormView__label>
            </bem.FormView__cell>
            <bem.FormView__cell>
              <span className="subs-graph-number">{this.props.asset.deployment__submission_count}</span>
              <bem.FormView__label>{t('Total')}</bem.FormView__label>
            </bem.FormView__cell>
          </bem.FormView__group>
        </bem.FormView__cell>
      </bem.FormView__row>
    );
  }
  render () {
    let asset = this.props.asset,
        docTitle = t('Summary');
    if (asset) {
      docTitle = asset.name || t('Untitled');
    }
    return (
      <DocumentTitle title={`${docTitle} | KoboToolbox`}>
        <bem.FormView m='summary'>
          {(asset.settings.country || asset.settings.sector || asset.settings.description) && 
            <bem.FormView__row>
              <bem.FormView__cell m='label'>
                {t('Description')}
              </bem.FormView__cell>
              <bem.FormView__cell m={['box']}>
                {(asset.settings.country || asset.settings.sector) && 
                  <bem.FormView__group m={['items', 'description-cols']}>
                    {asset.settings.country && 
                      <bem.FormView__cell>
                        <bem.FormView__label m='country'>{t('Project country')}</bem.FormView__label>
                        {asset.settings.country.label}
                      </bem.FormView__cell>
                    }
                    {asset.settings.sector && 
                      <bem.FormView__cell>
                        <bem.FormView__label m='sector'>{t('Sector')}</bem.FormView__label>
                        {asset.settings.sector.label}
                      </bem.FormView__cell>
                    }
                  </bem.FormView__group>
                }
                {asset.settings.description && 
                  <bem.FormView__cell m='description'>
                    {asset.settings.description}
                  </bem.FormView__cell>
                }
              </bem.FormView__cell>
            </bem.FormView__row>
          }

          <bem.FormView__row>
            <bem.FormView__cell m='label'>
              {t('Form details')}
            </bem.FormView__cell>
            <bem.FormView__cell m={['box']}>
              <bem.FormView__group m={['items', 'summary-details-cols']}>
                <bem.FormView__cell>
                  <bem.FormView__label>{t('Last modified')}</bem.FormView__label>
                  {formatTime(asset.date_modified)}
                </bem.FormView__cell>
                {this.state.lastSubmission &&
                  <bem.FormView__cell>
                    <bem.FormView__label>{t('Latest submission')}</bem.FormView__label>
                    {formatTime(this.state.lastSubmission)}
                  </bem.FormView__cell>
                }
                <bem.FormView__cell>
                  <bem.FormView__label>{t('Questions')}</bem.FormView__label>
                  {asset.summary.row_count}
                </bem.FormView__cell>
              </bem.FormView__group>
            </bem.FormView__cell>
          </bem.FormView__row>

          { this.state.lastSubmission && 
            this.renderSubmissionsGraph()
          }

        </bem.FormView>
      </DocumentTitle>
      );
  }

}

reactMixin(Summary.prototype, Reflux.ListenerMixin);

export default Summary;
