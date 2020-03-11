import logging

from treeherder.config.settings import (NEW_RELIC_INSIGHTS_API_KEY,
                                        NEW_RELIC_INSIGHTS_API_URL)
from treeherder.etl.common import make_request
from treeherder.model.models import Push
from treeherder.webapp.api.serializers import PushSerializer

logger = logging.getLogger(__name__)


def get_peak(facet):
    peak = 0
    date = 0
    for item in facet['timeSeries']:
        max = item['results'][-1]['max']
        if item['inspectedCount'] > 0 and max > peak:
            peak = max
            date = item['endTimeSeconds']

    return {'needInvestigation': peak, 'time': date}


def get_latest(facet):
    for item in reversed(facet['timeSeries']):
        if item['inspectedCount'] > 0:
            latest = item['results'][-1]
            return {
                'needInvestigation': latest['max'],
                'time': item['endTimeSeconds']
            }


def get_usage():
    nrql = "SELECT%20max(needInvestigation)%20FROM%20push_health_need_investigation%20FACET%20revision%20SINCE%201%20DAY%20AGO%20TIMESERIES%20where%20repo%3D'{}'%20AND%20appName%3D'{}'".format(
        'try', 'treeherder-prod')
    newRelicUrl = '{}?nrql={}'.format(NEW_RELIC_INSIGHTS_API_URL, nrql)
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Query-Key': NEW_RELIC_INSIGHTS_API_KEY,
    }
    if not NEW_RELIC_INSIGHTS_API_KEY:
        exception = EnvironmentError('NEW_RELIC_INSIGHTS_API_KEY not set on server.')
        logger.exception(exception)
        raise exception

    resp = make_request(newRelicUrl, headers=headers)
    data = resp.json()
    push_revisions = [facet['name'] for facet in data['facets']]
    pushes = Push.objects.filter(revision__in=push_revisions)

    results = [{
        'push': PushSerializer(pushes.get(revision=facet['name'])).data,
        'peak': get_peak(facet),
        'latest': get_latest(facet)
    } for facet in data['facets']]

    return results
