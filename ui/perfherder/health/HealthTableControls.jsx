import React from 'react';
import PropTypes from 'prop-types';
import { Container } from 'reactstrap';

import FilterControls from '../FilterControls';
import { containsText } from '../helpers';

import HealthTable from './HealthTable';

export default class HealthTableControls extends React.Component {
  constructor(props) {
    super(props);
    this.validated = this.props.validated;
    this.state = {
      results: [],
      filterText: '',
    };
  }

  componentDidMount() {
    this.updateFilteredResults();
  }

  componentDidUpdate(prevProps) {
    const { healthResults } = this.props;
    if (prevProps.healthResults !== healthResults) {
      this.updateFilteredResults();
    }
  }

  updateFilterText = filterText => {
    this.setState({ filterText }, () => this.updateFilteredResults());
  };

  updateFilteredResults = () => {
    const { filterText } = this.state;
    const { healthResults } = this.props;

    if (!filterText) {
      return this.setState({ results: healthResults });
    }

    const filteredResults = healthResults.filter(result =>
      this.filterResult(result),
    );

    this.setState({ results: filteredResults });
  };

  filterResult = result => {
    const { filterText } = this.state;

    if (!filterText) return true;

    const textToSearch = `${result.test} ${result.suite}`;
    return containsText(textToSearch, filterText);
  };

  render() {
    const { dropdownOptions, projectsMap, platformsMap } = this.props;
    const { results } = this.state;

    return (
      <Container fluid className="my-3 px-0">
        <FilterControls
          updateFilterText={this.updateFilterText}
          dropdownOptions={dropdownOptions}
          dropdownCol
        />

        <HealthTable
          results={results}
          projectsMap={projectsMap}
          platformsMap={platformsMap}
        />
      </Container>
    );
  }
}

HealthTableControls.propTypes = {
  healthResults: PropTypes.arrayOf(PropTypes.shape({})),
  dropdownOptions: PropTypes.arrayOf(PropTypes.shape({})),
  projectsMap: PropTypes.oneOfType([PropTypes.bool, PropTypes.shape({})])
    .isRequired,
  platformsMap: PropTypes.oneOfType([PropTypes.bool, PropTypes.shape({})])
    .isRequired,
};

HealthTableControls.defaultProps = {
  healthResults: [],
  dropdownOptions: [],
};
