#!/usr/bin/env perl
use strict;
use warnings;
use autodie;
# CPAN modules required:
use Spreadsheet::Write;
use Text::CSV;

my $xlsx_file = shift @ARGV;
$xlsx_file .= ".xlsx" unless $xlsx_file =~ /\.xlsx$/;
my $xlsx = Spreadsheet::Write->new(file => $xlsx_file);
my $csv = Text::CSV->new({binary => 1});

for my $csv_file (@ARGV) {
    my @rows = ();
    open my $fh, "<:encoding(utf8)", $csv_file;
    while (my $row = $csv->getline($fh)) {
        push @rows, $row;
    }
    $csv->eof or $csv->error_diag();
    close $fh;  

    (my $sheet_name = $csv_file) =~ s/\.[^.]+$//;   # strip extension
    $xlsx->addsheet($sheet_name);
    $xlsx->addrows(@rows);
}
$xlsx->close();
